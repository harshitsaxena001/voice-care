import { useState, useRef } from "react";
import { fetchWithAuth } from "../../lib/api";
import { Loader2, X, Upload } from "lucide-react";
import Papa from "papaparse";
import { read, utils } from "xlsx";
import { toast } from "sonner";

interface ImportVaccinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportVaccinationsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportVaccinationsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    // Give React a chance to paint the loading UI before heavy parsing starts.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    try {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      const isCsv = fileName.endsWith(".csv");

      if (!isExcel && !isCsv) {
        throw new Error("Please upload a CSV or Excel file.");
      }

      let parsedData: any[] = [];

      if (isCsv) {
        parsedData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(new Error(err.message)),
          });
        });
      } else {
        const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
          reader.onerror = (e) =>
            reject(new Error("Failed to read the excel file."));
          reader.readAsArrayBuffer(file);
        });
        const workbook = read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        parsedData = utils.sheet_to_json(worksheet);
      }

      if (parsedData.length === 0) {
        throw new Error("The uploaded file is empty.");
      }

      const res = await fetchWithAuth("/vaccinations/import", {
        method: "POST",
        body: JSON.stringify({ data: parsedData }),
      });

      const importedCount = res?.data?.imported || 0;
      if (importedCount === 0) {
        toast.error(
          "No valid records found. Ensure columns like Name and Phone match.",
        );
      } else {
        toast.success(`Successfully imported ${importedCount} records`);
        onSuccess();
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import the file.");
      toast.error(err.message || "Failed to import the file.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      aria-busy={loading}
    >
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl text-primary mb-6">Import Vaccinations</h2>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV or Excel file. Required columns are{" "}
            <strong>Name</strong> and <strong>Phone Number</strong>. Optional
            columns: <strong>Age</strong>, <strong>Vaccine Name</strong>,{" "}
            <strong>Dose</strong>, <strong>Next Vaccination Date</strong>.
          </p>

          <div
            className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
              loading
                ? "cursor-not-allowed opacity-75"
                : "hover:border-primary/50 cursor-pointer"
            }`}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              disabled={loading}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Uploading… please wait
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Click to select a CSV or Excel file
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-500/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              {loading ? "Cancel" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
