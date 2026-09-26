import { createAdminClient } from "@/lib/supabase/admin";

export default async function StatusPage() {
  let ok = false;
  let message = "";

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      message = error.message;
    } else {
      ok = true;
    }
  } catch (err) {
    message = err instanceof Error ? err.message : "Error desconocido";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-marca">
        Estado de Supabase
      </h1>

      {ok ? (
        <p className="text-lg text-foreground">Conexión con Supabase OK</p>
      ) : (
        <div className="flex max-w-md flex-col gap-3">
          <p className="text-lg text-rojo-texto">No se pudo conectar con Supabase</p>
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm break-words text-muted-foreground">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
