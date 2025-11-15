import { useState, useEffect } from "react";
import { Monitor, Smartphone, Laptop, MapPin, Calendar, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { format } from "date-fns";

interface TrustedDevice {
  id: string;
  device: string;
  location: string;
  lastSeen: string;
  isTrusted: boolean;
  deviceType: "desktop" | "mobile" | "tablet";
}

const TrustedDevices = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchTrustedDevices();
  }, []);

  const fetchTrustedDevices = async () => {
    // Mock data - in production, fetch from Supabase
    const mockDevices: TrustedDevice[] = [
      {
        id: "1",
        device: "Windows 11 · Edge",
        location: "Kigali, Rwanda",
        lastSeen: new Date().toISOString(),
        isTrusted: true,
        deviceType: "desktop"
      },
      {
        id: "2",
        device: "iPhone 14 · Safari",
        location: "Nairobi, Kenya",
        lastSeen: new Date(Date.now() - 86400000).toISOString(),
        isTrusted: false,
        deviceType: "mobile"
      },
      {
        id: "3",
        device: "MacBook Pro · Chrome",
        location: "Kampala, Uganda",
        lastSeen: new Date(Date.now() - 172800000).toISOString(),
        isTrusted: true,
        deviceType: "desktop"
      }
    ];
    
    setDevices(mockDevices);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Laptop className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const handleToggleTrust = (deviceId: string) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, isTrusted: !device.isTrusted }
        : device
    ));
    
    const device = devices.find(d => d.id === deviceId);
    toast.success(
      device?.isTrusted 
        ? "Device removed from trusted list"
        : "Device marked as trusted"
    );
  };

  const handleRemoveDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveDevice = () => {
    if (selectedDevice) {
      setDevices(devices.filter(d => d.id !== selectedDevice));
      toast.success("Device removed successfully");
    }
    setShowRemoveDialog(false);
    setSelectedDevice(null);
  };

  const handleRemoveAllTrusted = () => {
    setDevices(devices.map(device => ({ ...device, isTrusted: false })));
    toast.success("All trusted devices removed");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Trusted Devices
              </CardTitle>
              <CardDescription>
                Devices that can skip 2FA verification
              </CardDescription>
            </div>
            {devices.some(d => d.isTrusted) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveAllTrusted}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove All Trusted
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-center">Trusted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getDeviceIcon(device.deviceType)}
                          </div>
                          <span className="font-medium">{device.device}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {device.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(device.lastSeen), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {device.isTrusted ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="w-3 h-3" />
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTrust(device.id)}
                          >
                            {device.isTrusted ? "Untrust" : "Trust"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDevice(device.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> Trusted devices can sign in without requiring a 2FA code. 
              Only mark devices you personally own and use regularly as trusted.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remove Device Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this device? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveDevice}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrustedDevices;
