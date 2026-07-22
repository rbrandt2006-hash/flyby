import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/integrations/backend/client";

interface AvatarUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  userId: string;
  onAvatarUpdated: (newUrl: string | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const OUTPUT_SIZE = 512;

// Helper to create image from URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

// Helper to get cropped image as blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number = OUTPUT_SIZE
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/png",
      0.9
    );
  });
}

export function AvatarUploadModal({
  open,
  onOpenChange,
  currentAvatarUrl,
  userId,
  onAvatarUpdated,
}: AvatarUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPG, PNG, or WEBP image.",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsSaving(true);
    try {
      // Get cropped image blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Upload to Supabase Storage
      const filePath = `${userId}/avatar.png`;
      
      const { error: uploadError } = await backend.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: "image/png",
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = backend.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache buster to URL
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile in database
      const { error: updateError } = await backend
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdated(avatarUrl);
      toast.success("Profile photo updated");
      handleClose();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to save photo", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatarUrl) return;

    setIsRemoving(true);
    try {
      // Delete from storage
      const filePath = `${userId}/avatar.png`;
      await backend.storage.from("avatars").remove([filePath]);

      // Update profile in database
      const { error: updateError } = await backend
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdated(null);
      toast.success("Profile photo removed");
      handleClose();
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove photo", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile Photo</DialogTitle>
          <DialogDescription>
            Upload and crop your profile picture
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        {!imageSrc ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              onClick={triggerFileSelect}
              className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Click to upload a photo<br />
              <span className="text-xs">JPG, PNG, or WEBP • Max 5MB</span>
            </p>
            <Button variant="outline" onClick={triggerFileSelect}>
              Choose File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cropper container */}
            <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 px-2">
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => setZoom(values[0])}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerFileSelect}
              className="text-muted-foreground"
            >
              Choose different photo
            </Button>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <div>
            {currentAvatarUrl && !imageSrc && (
              <Button
                variant="ghost"
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Remove photo
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {imageSrc && (
              <Button
                onClick={handleSave}
                disabled={isSaving || !croppedAreaPixels}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
