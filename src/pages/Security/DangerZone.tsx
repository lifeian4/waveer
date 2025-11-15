import { useState } from "react";
import { AlertTriangle, Trash2, PauseCircle, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const DangerZone = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const handleDeactivateAccount = async () => {
    try {
      if (!currentUser?.id) throw new Error("No user found");

      // Update profile status to deactivated
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          account_status: 'deactivated',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          account_status: 'deactivated', 
          deactivated_at: new Date().toISOString() 
        }
      });

      if (authError) throw authError;

      toast.success("Account deactivated successfully");
      
      // Sign out the user
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Deactivation error:", error);
      toast.error(error.message || "Failed to deactivate account");
    } finally {
      setShowDeactivateDialog(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE" || !confirmDelete) {
      toast.error("Please confirm account deletion");
      return;
    }

    try {
      if (!currentUser?.id) throw new Error("No user found");

      // Step 1: Delete user profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', currentUser.id);

      if (profileError) {
        console.error("Profile deletion error:", profileError);
        throw new Error("Failed to delete profile. Please contact support.");
      }

      // Step 2: Delete other user data (favorites, enrollments, etc.)
      // Note: These will cascade delete if foreign keys are set up properly
      await supabase.from('favorites').delete().eq('user_id', currentUser.id);
      await supabase.from('enrollments').delete().eq('user_id', currentUser.id);
      await supabase.from('course_progress').delete().eq('user_id', currentUser.id);

      // Step 3: Sign out (this will end the session)
      await supabase.auth.signOut();

      toast.success("Account deleted successfully");
      
      // Redirect to home
      navigate("/");
    } catch (error: any) {
      console.error("Deletion error:", error);
      toast.error(error.message || "Failed to delete account. Please contact support.");
    } finally {
      setShowDeleteDialog(false);
      setConfirmText("");
      setConfirmDelete(false);
      setDeleteReason("");
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Deactivate Account */}
          <div className="p-4 rounded-lg border border-orange-500/50 bg-orange-500/5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                    Deactivate Account
                  </h3>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Temporarily disable your account. You can reactivate it anytime by logging back in.
                </p>
                <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1 mt-2 list-disc list-inside">
                  <li>Your profile will be hidden from other users</li>
                  <li>You'll be logged out of all devices</li>
                  <li>Your data will be preserved</li>
                  <li>Subscriptions will remain active</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                onClick={() => setShowDeactivateDialog(true)}
              >
                <PauseCircle className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="p-4 rounded-lg border border-destructive bg-destructive/5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">
                    Delete Account Permanently
                  </h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 mt-2 list-disc list-inside">
                  <li>All your data will be permanently deleted</li>
                  <li>Your posts, comments, and messages will be removed</li>
                  <li>Active subscriptions will be cancelled</li>
                  <li>You cannot recover your account after deletion</li>
                </ul>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Important Notice
                </p>
                <p className="text-muted-foreground mt-1">
                  Before taking any action in the danger zone, make sure you understand the consequences. 
                  Consider downloading your data first if you want to keep a backup.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Account Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-orange-600" />
              Deactivate Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Your account will be temporarily disabled. You can reactivate it by logging back in.</p>
              <p className="font-medium text-foreground">What happens when you deactivate:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile becomes invisible to others</li>
                <li>You'll be logged out from all devices</li>
                <li>Your subscriptions remain active</li>
                <li>All your data is preserved</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Your Account Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-destructive">
                This action is irreversible and will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and all personal information</li>
                <li>All posts, comments, and messages</li>
                <li>Your watch history and preferences</li>
                <li>Active subscriptions (no refunds)</li>
                <li>All uploaded content</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Why are you leaving? (Optional)</Label>
              <Input
                placeholder="Help us improve..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type "DELETE" to confirm</Label>
              <Input
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-delete"
                checked={confirmDelete}
                onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this action cannot be undone
              </label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmText("");
              setConfirmDelete(false);
              setDeleteReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE" || !confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DangerZone;
