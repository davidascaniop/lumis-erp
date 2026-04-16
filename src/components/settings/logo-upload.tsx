"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, Edit2, FileImage } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const maxSize = 512;
      let width = img.width;
      let height = img.height;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob failed"));
          },
          "image/webp",
          0.85
        );
      } else {
        reject(new Error("Canvas context is null"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

export function LogoUpload({ currentLogoUrl }: { currentLogoUrl?: string }) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();
  const { user, refreshUser } = useUser();

  useEffect(() => {
    if (currentLogoUrl) setLogoUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Check size
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Máximo 2MB.");
      return;
    }

    // Check format
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Solo se aceptan archivos PNG, JPG o WebP.");
      return;
    }

    try {
      // Preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsUploading(true);

      const compressedBlob = await compressImage(file);
      const companyId = user?.company_id;
      
      if (!companyId) {
        throw new Error("Compañía no encontrada");
      }

      const fileName = `${companyId}/logo-${Date.now()}.webp`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, compressedBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Update companies table
      const { error: dbError } = await supabase
        .from("companies")
        .update({ logo_url: publicUrl })
        .eq("id", companyId);

      if (dbError) throw dbError;

      // Also clean up old logos if necessary... (Optional feature)

      setLogoUrl(publicUrl);
      setPreviewUrl(null);
      await refreshUser(); // updates sidebar
      toast.success("Logo actualizado correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir el logo", { description: err.message });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeLogo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar el logo?")) return;
    
    setIsUploading(true);
    try {
      const companyId = user?.company_id;
      if (!companyId) throw new Error("Compañía no encontrada");

      // Extract filename
      if (logoUrl) {
        const parts = logoUrl.split('/');
        const fileName = `${companyId}/${parts[parts.length - 1]}`;
        await supabase.storage.from('company-logos').remove([fileName]);
      }

      await supabase.from("companies").update({ logo_url: null }).eq("id", companyId);
      
      setLogoUrl(null);
      await refreshUser();
      toast.success("Logo eliminado");
    } catch(err: any) {
      toast.error("Error eliminando logo");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || logoUrl;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
        }}
      />

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-32 h-32 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden relative shadow-sm border-2 border-dashed ${
          isHovering
            ? "border-brand bg-[rgba(224,64,251,0.05)] shadow-[0_0_15px_rgba(224,64,251,0.2)]"
            : "border-border/60 bg-surface-base hover:bg-[rgba(224,64,251,0.02)]"
        }`}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-1" />
            <span className="text-[10px] text-white font-bold animate-pulse">Subiendo...</span>
          </div>
        )}

        {displayUrl ? (
          <>
            <img src={displayUrl} alt="Logo Prev" className="w-full h-full object-contain p-2 z-0" />
            
            {/* Hover Actions overlay */}
            {!isUploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity z-10 flex items-center justify-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg transition-colors"
                  title="Cambiar Logo"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={removeLogo}
                  className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                  title="Eliminar Logo"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-center p-2">
            <Upload className={`w-8 h-8 transition-transform mb-1 ${isHovering ? "text-brand scale-110" : "text-text-3"}`} />
            <span className="text-[8px] text-text-3 font-bold uppercase tracking-wider">
              Arrastra o Haz Clic
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <p className="text-sm text-text-1 font-bold font-montserrat">
          Sube el logotipo de tu organización.
        </p>
        <p className="text-xs text-text-2 font-medium leading-relaxed">
          Arrastra tu logo aquí o haz clic para seleccionar.<br/>
          <span className="text-text-3 font-mono mt-1 block tracking-tight">
            <FileImage className="inline w-3 h-3 mr-1" />
            PNG, JPG o WebP · Máximo 2MB · Recomendado 512×512px
          </span>
        </p>
        {!displayUrl && (
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 bg-surface-card border-border/60 text-text-2 hover:bg-surface-base font-bold rounded-xl px-6"
          >
            Seleccionar Archivo
          </Button>
        )}
      </div>
    </div>
  );
}
