import { useState } from "react";
import { Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import { Button, Illustration, Paper } from "../ui.jsx";

/** Acceso: usuario y contraseña descifran el temario, que viaja cifrado dentro de la app. */
export default function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!user.trim() || !pass.trim()) {
      setError("Escribe tu usuario y tu contraseña.");
      return;
    }
    setBusy(true);
    setError("");
    const r = await onLogin(user, pass);
    setBusy(false);
    if (!r.ok) setError(r.error);
  };

  const field = "w-full h-14 rounded-full bg-ground border-2 border-line px-5 text-ink caret-ink font-semibold outline-none focus:border-ink transition-colors";

  return (
    <div className="fixed inset-0 bg-ground scroll-area">
      <div className="max-w-md mx-auto px-4 pt-safe pb-safe min-h-full flex flex-col justify-center gap-6 py-8">
        <header>
          <h1 className="brand text-[50px]">Opoempollo</h1>
          <p className="label text-ink-soft mt-2">Oposición a Subalterno · Ayuntamiento de Cádiz</p>
        </header>

        <Paper className="p-5 anim-rise">
          <div className="bg-ground-2 rounded-[22px] p-4">
            <Illustration name="bienvenida" className="w-full" alt="" />
          </div>
          <p className="display text-[30px] mt-4">Accede a tu temario</p>
          <p className="text-[15px] text-ink-soft mt-1">Las lecciones, preguntas y tarjetas están cifradas. Entra una vez y se quedan en este dispositivo.</p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="login-user" className="label text-ink-soft block mb-2">
                Usuario
              </label>
              <input
                id="login-user"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className={field}
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="login-pass" className="label text-ink-soft block mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className={`${field} pr-14`}
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="tap absolute right-1 top-1 w-12 h-12 rounded-full text-ink-soft flex items-center justify-center"
                >
                  {show ? <EyeSlash size={22} weight="bold" /> : <Eye size={22} weight="bold" />}
                </button>
              </div>
            </div>
            {error && (
              <p id="login-error" role="alert" className="text-sm font-semibold text-plum -mt-1">
                {error}
              </p>
            )}
            <Button type="submit" variant="blue" disabled={busy} className="w-full">
              <LockKey size={20} weight="bold" /> {busy ? "Abriendo tu temario…" : "Entrar"}
            </Button>
          </form>
        </Paper>
      </div>
    </div>
  );
}
