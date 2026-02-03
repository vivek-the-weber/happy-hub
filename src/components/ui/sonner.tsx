import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-full bg-neutral-900 text-white border border-white/10 shadow-lg px-4 py-3 flex items-center gap-2",
          description: "text-white/70 text-sm",
          actionButton: "bg-white text-neutral-900 rounded-full px-3 py-1 text-sm font-medium",
          cancelButton: "bg-white/10 text-white rounded-full px-3 py-1 text-sm",
          success: "!bg-neutral-900 !text-white !border-white/10",
          error: "!bg-neutral-900 !text-white !border-white/10",
          warning: "!bg-neutral-900 !text-white !border-white/10",
          info: "!bg-neutral-900 !text-white !border-white/10",
        },
      }}
      icons={{
        success: <CheckCircle className="h-4 w-4 text-green-500" />,
        error: <XCircle className="h-4 w-4 text-red-500" />,
        warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
        info: <Info className="h-4 w-4 text-blue-500" />,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
