/**
 * Production-Ready Chat + Calling Client
 * Socket.IO + WebRTC integration
 * 
 * Features:
 * - Real-time messaging with delivery/read status
 * - WebRTC P2P audio/video calling
 * - Presence management
 * - Typing indicators
 * - Automatic reconnection
 */

import { io, Socket } from 'socket.io-client';

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  room_id?: string;
  message_text?: string;
  media_url?: string;
  media_type: 'text' | 'audio' | 'video' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  delivered_at?: string;
  read_at?: string;
}

export interface CallState {
  callId: string;
  callType: 'audio' | 'video';
  callerId: string;
  calleeId?: string;
  status: 'initiated' | 'ringing' | 'accepted' | 'rejected' | 'ended';
  startTime?: number;
  duration?: number;
}

export interface RTCPeerConfig {
  iceServers: RTCIceServer[];
}

// ============================================================================
// CHAT CLIENT CLASS
// ============================================================================

export class ChatClient {
  private socket: Socket | null = null;
  private token: string;
  private userId: string;
  private serverUrl: string;

  // WebRTC state
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private currentCall: CallState | null = null;

  // Callbacks
  private messageReceivedCallback: ((msg: Message) => void) | null = null;
  private messageStatusChangedCallback: ((msgId: string, status: string) => void) | null = null;
  private typingIndicatorCallback: ((userId: string, isTyping: boolean) => void) | null = null;
  private callIncomingCallback: ((call: CallState) => void) | null = null;
  private callAnsweredCallback: ((call: CallState) => void) | null = null;
  private callEndedCallback: ((call: CallState) => void) | null = null;
  private remoteStreamCallback: ((userId: string, stream: MediaStream) => void) | null = null;
  private userOnlineCallback: ((userId: string) => void) | null = null;
  private userOfflineCallback: ((userId: string) => void) | null = null;

  constructor(serverUrl: string, token: string, userId: string) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.userId = userId;
  }

  /**
   * Connect to chat server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${this.serverUrl}/chat`, {
          auth: { token: this.token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('[Chat] Connected to server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Chat] Connection error:', error);
          reject(error);
        });

        this.setupSocketListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketListeners() {
    if (!this.socket) return;

    // Messaging events
    this.socket.on('message:received', (msg: Message) => {
      this.messageReceivedCallback?.(msg);
      // Auto-acknowledge delivery
      this.socket?.emit('message:delivered', { messageId: msg.id });
    });

    this.socket.on('message:status', (data: any) => {
      this.messageStatusChangedCallback?.(data.messageId, data.status);
    });

    this.socket.on('typing:indicator', (data: any) => {
      this.typingIndicatorCallback?.(data.userId, data.isTyping);
    });

    // Calling events
    this.socket.on('call:incoming', (data: any) => {
      this.currentCall = {
        callId: data.callId,
        callType: data.callType,
        callerId: data.callerId,
        status: 'ringing',
      };
      this.callIncomingCallback?.(this.currentCall);
    });

    this.socket.on('call:offer', async (data: any) => {
      await this.handleRemoteOffer(data);
    });

    this.socket.on('call:answer', async (data: any) => {
      await this.handleRemoteAnswer(data);
    });

    this.socket.on('call:ice-candidate', async (data: any) => {
      await this.handleRemoteICECandidate(data);
    });

    this.socket.on('call:rejected', (data: any) => {
      this.endCall(data.callId);
    });

    this.socket.on('call:ended', (data: any) => {
      this.currentCall = { ...this.currentCall!, status: 'ended', duration: data.duration };
      this.callEndedCallback?.(this.currentCall);
      this.cleanup();
    });

    // Presence events
    this.socket.on('user:online', (data: any) => {
      this.userOnlineCallback?.(data.userId);
    });

    this.socket.on('user:offline', (data: any) => {
      this.userOfflineCallback?.(data.userId);
    });
  }

  /**
   * Send message (1:1 or group)
   */
  async sendMessage(
    text: string,
    receiverId?: string,
    roomId?: string,
    mediaUrl?: string,
    mediaType?: string
  ): Promise<void> {
    if (!this.socket) throw new Error('Not connected');

    this.socket.emit('message:send', {
      receiverId,
      roomId,
      text,
      mediaUrl,
      mediaType: mediaType || 'text',
    });
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('message:read', { messageId });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(receiverId?: string, roomId?: string, isTyping: boolean = true): void {
    if (!this.socket) return;

    if (isTyping) {
      this.socket.emit('typing:start', { receiverId, roomId });
    } else {
      this.socket.emit('typing:stop', { receiverId, roomId });
    }
  }

  // =========================================================================
  // CALLING METHODS
  // =========================================================================

  /**
   * Initiate audio/video call
   */
  async initiateCall(calleeId: string, callType: 'audio' | 'video'): Promise<string> {
    if (!this.socket) throw new Error('Not connected');

    // Get user media
    const constraints = {
      audio: true,
      video: callType === 'video' ? { width: 1280, height: 720 } : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Emit call initiation
      this.socket.emit('call:initiate', { calleeId, callType });

      return new Promise((resolve) => {
        this.socket?.once('call:initiated', (data: any) => {
          this.currentCall = {
            callId: data.callId,
            callType,
            callerId: this.userId,
            calleeId,
            status: 'initiated',
            startTime: Date.now(),
          };
          resolve(data.callId);
        });
      });
    } catch (error) {
      console.error('[WebRTC] Error getting user media:', error);
      throw error;
    }
  }

  /**
   * Answer incoming call
   */
  async answerCall(callId: string, callType: 'audio' | 'video'): Promise<void> {
    if (!this.socket) throw new Error('Not connected');

    try {
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: 1280, height: 720 } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create peer connection
      const peerConnection = await this.createPeerConnection(callId);

      // Add local stream tracks
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer to caller
      this.socket.emit('call:answer', {
        callId,
        callerId: this.currentCall?.callerId,
        answer: answer.sdp,
        callType,
      });

      this.currentCall = { ...this.currentCall!, status: 'accepted' };
      this.callAnsweredCallback?.(this.currentCall!);
    } catch (error) {
      console.error('[WebRTC] Error answering call:', error);
      throw error;
    }
  }

  /**
   * Reject call
   */
  rejectCall(callId: string, callType: 'audio' | 'video'): void {
    if (!this.socket) return;
    this.socket.emit('call:reject', { callId, callType });
    this.cleanup();
  }

  /**
   * End call
   */
  endCall(callId: string): void {
    if (!this.socket) return;

    const duration = this.currentCall?.startTime ? Date.now() - this.currentCall.startTime : 0;
    this.socket.emit('call:end', {
      callId,
      callType: this.currentCall?.callType || 'video',
      duration,
    });

    this.cleanup();
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }

  // =========================================================================
  // WEBRTC PEER CONNECTION MANAGEMENT
  // =========================================================================

  /**
   * Create RTCPeerConnection
   */
  private async createPeerConnection(callId: string): Promise<RTCPeerConnection> {
    try {
      // Get TURN config from server
      const response = await fetch(`${this.serverUrl}/chat/turn-config`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const config: RTCPeerConfig = await response.json();

      const peerConnection = new RTCPeerConnection({
        iceServers: config.iceServers,
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket?.emit('call:ice-candidate', {
            callId,
            candidate: event.candidate,
            targetUserId: this.currentCall?.calleeId || this.currentCall?.callerId,
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        const remoteStream = event.streams[0];
        this.remoteStreams.set(callId, remoteStream);
        this.remoteStreamCallback?.(callId, remoteStream);
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
          this.endCall(callId);
        }
      };

      this.peerConnections.set(callId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error('[WebRTC] Error creating peer connection:', error);
      throw error;
    }
  }

  /**
   * Handle remote offer
   */
  private async handleRemoteOffer(data: any) {
    try {
      const peerConnection = await this.createPeerConnection(data.callId);

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, this.localStream!);
        });
      }

      // Set remote description
      const offer = new RTCSessionDescription({ type: 'offer', sdp: data.offer });
      await peerConnection.setRemoteDescription(offer);

      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.socket?.emit('call:answer', {
        callId: data.callId,
        callerId: this.currentCall?.callerId,
        answer: answer.sdp,
      });
    } catch (error) {
      console.error('[WebRTC] Error handling remote offer:', error);
    }
  }

  /**
   * Handle remote answer
   */
  private async handleRemoteAnswer(data: any) {
    try {
      const peerConnection = this.peerConnections.get(data.callId);
      if (!peerConnection) return;

      const answer = new RTCSessionDescription({ type: 'answer', sdp: data.answer });
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('[WebRTC] Error handling remote answer:', error);
    }
  }

  /**
   * Handle remote ICE candidate
   */
  private async handleRemoteICECandidate(data: any) {
    try {
      const peerConnection = this.peerConnections.get(data.callId);
      if (!peerConnection) return;

      const candidate = new RTCIceCandidate(data.candidate);
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }

  // =========================================================================
  // CLEANUP & TEARDOWN
  // =========================================================================

  /**
   * Cleanup resources
   */
  private cleanup() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Clear remote streams
    this.remoteStreams.clear();

    this.currentCall = null;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // =========================================================================
  // CALLBACK REGISTRATION
  // =========================================================================

  onMessage(callback: (msg: Message) => void) {
    this.messageReceivedCallback = callback;
  }

  onStatusChange(callback: (msgId: string, status: string) => void) {
    this.messageStatusChangedCallback = callback;
  }

  onTyping(callback: (userId: string, isTyping: boolean) => void) {
    this.typingIndicatorCallback = callback;
  }

  onIncomingCall(callback: (call: CallState) => void) {
    this.callIncomingCallback = callback;
  }

  onCallAnsweredEvent(callback: (call: CallState) => void) {
    this.callAnsweredCallback = callback;
  }

  onCallEndedEvent(callback: (call: CallState) => void) {
    this.callEndedCallback = callback;
  }

  onRemoteStreamReceived(callback: (userId: string, stream: MediaStream) => void) {
    this.remoteStreamCallback = callback;
  }

  onUserOnlineEvent(callback: (userId: string) => void) {
    this.userOnlineCallback = callback;
  }

  onUserOfflineEvent(callback: (userId: string) => void) {
    this.userOfflineCallback = callback;
  }
}

export default ChatClient;
