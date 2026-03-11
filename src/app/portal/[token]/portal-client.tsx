"use client";

import { useState } from "react";
import { submitPortalPayment } from "@/lib/actions/portal";
import { createClient } from "@/lib/supabase/client";

const METHODS = [
  { id: "zelle", emoji: "💵", label: "Zelle" },
  { id: "pago_movil", emoji: "📱", label: "Pago Móvil" },
  { id: "cash_usd", emoji: "💴", label: "Efectivo $" },
  { id: "cash_bs", emoji: "💶", label: "Efectivo Bs." },
  { id: "transfer", emoji: "🏦", label: "Transferencia" },
  { id: "otro", emoji: "🔄", label: "Otro" },
];

export function PortalClient({ data, token }: { data: any; token: string }) {
  const [step, setStep] = useState<"list" | "pay" | "success">("list");
  const [selected, setSelected] = useState<any>(null);
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setRef] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const primary = data.company?.primary_color ?? "#E040FB";
  const totalDebt = data.receivables.reduce(
    (s: number, r: any) => s + (r.balance_usd ?? 0),
    0,
  );
  const isFormValid = method && amount && name && reference;

  // Subir comprobante a Supabase Storage
  const uploadProof = async (
    file: File,
    ref: string,
  ): Promise<string | undefined> => {
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `proofs/${data.companyId}/${ref}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("lumis-content")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) return undefined;

      const { data: urlData } = supabase.storage
        .from("lumis-content")
        .getPublicUrl(path);

      return urlData?.publicUrl;
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    try {
      let proofUrl: string | undefined;
      if (proof) proofUrl = await uploadProof(proof, reference);

      await submitPortalPayment({
        token,
        receivableId: selected.id,
        amount: parseFloat(amount),
        method,
        reference,
        clientName: name,
        clientPhone: phone,
        proofUrl,
      });
      setStep("success");
    } catch (e: any) {
      setError(e.message ?? "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ─── PANTALLA ÉXITO ──────────────────────────────────────
  if (step === "success")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0F0A12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#F0E8FF",
              margin: 0,
            }}
          >
            ¡Pago registrado!
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#8A7AAA",
              margin: "12px 0 0",
              lineHeight: 1.7,
            }}
          >
            Tu pago de{" "}
            <strong style={{ color: "#00E5CC" }}>
              ${parseFloat(amount).toFixed(2)}
            </strong>{" "}
            fue recibido.
            <br />
            El equipo lo está verificando.
            <br />
            Te confirmaremos cuando esté listo.
          </p>
          <div
            style={{
              background: "rgba(0,229,204,0.06)",
              border: "1px solid rgba(0,229,204,0.15)",
              borderRadius: 14,
              padding: "16px 20px",
              marginTop: 24,
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 12, color: "#8A7AAA", margin: 0 }}>
              Referencia:{" "}
              <span style={{ color: "#F0E8FF", fontFamily: "monospace" }}>
                {reference}
              </span>
            </p>
            <p style={{ fontSize: 12, color: "#8A7AAA", margin: "6px 0 0" }}>
              Método: {METHODS.find((m) => m.id === method)?.label}
            </p>
            <p style={{ fontSize: 12, color: "#8A7AAA", margin: "6px 0 0" }}>
              Factura: {selected?.invoice_number}
            </p>
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#4A3A6A",
              marginTop: 32,
            }}
          >
            Powered by <strong style={{ color: "#E040FB" }}>LUMIS</strong>
          </p>
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0A12",
        fontFamily: "DM Sans, sans-serif",
        paddingBottom: 40,
      }}
    >
      {/* ─── HEADER EMPRESA ─── */}
      <div
        style={{
          background: "#110B1A",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {data.company?.logo_url ? (
          <img
            src={data.company.logo_url}
            alt=""
            style={{ height: 36, borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: `linear-gradient(135deg,${primary},#7C4DFF)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#fff",
              fontSize: 16,
            }}
          >
            {data.company?.name?.[0] ?? "L"}
          </div>
        )}
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#F0E8FF",
              margin: 0,
            }}
          >
            {data.company?.name ?? "LUMIS"}
          </p>
          <p style={{ fontSize: 11, color: "#8A7AAA", margin: 0 }}>
            Portal de Pagos
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        {/* ─── SALUDO ─── */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#F0E8FF",
              margin: 0,
            }}
          >
            Hola, {data.partner?.name ?? "Cliente"} 👋
          </h2>
          {totalDebt > 0 ? (
            <p style={{ fontSize: 14, color: "#8A7AAA", margin: "6px 0 0" }}>
              Tienes{" "}
              <strong style={{ color: "#FF2D55" }}>
                ${totalDebt.toFixed(2)}
              </strong>{" "}
              pendientes de pago
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "#00E5CC", margin: "6px 0 0" }}>
              ✓ ¡Estás al día! Sin deudas pendientes.
            </p>
          )}
        </div>

        {/* ─── PASO: LISTA DE FACTURAS ─── */}
        {step === "list" && (
          <>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                margin: "0 0 12px",
              }}
            >
              Facturas Pendientes
            </p>

            {data.receivables.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "rgba(0,229,204,0.06)",
                  border: "1px solid rgba(0,229,204,0.15)",
                  borderRadius: 16,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <p style={{ color: "#00E5CC", margin: 0, fontWeight: 700 }}>
                  ¡Todo al día!
                </p>
                <p
                  style={{ color: "#8A7AAA", fontSize: 13, margin: "6px 0 0" }}
                >
                  No tienes facturas pendientes
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {data.receivables.map((r: any) => {
                  const isOverdue = new Date(r.due_date) < new Date();
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelected(r);
                        setAmount((r.balance_usd ?? 0).toFixed(2));
                        setStep("pay");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px",
                        borderRadius: 14,
                        cursor: "pointer",
                        background: isOverdue
                          ? "rgba(255,45,85,0.06)"
                          : "rgba(255,255,255,0.04)",
                        border: isOverdue
                          ? "1px solid rgba(255,45,85,0.20)"
                          : "1px solid rgba(255,255,255,0.08)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#F0E8FF",
                            margin: 0,
                          }}
                        >
                          {r.invoice_number}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: isOverdue ? "#FF2D55" : "#8A7AAA",
                            margin: "4px 0 0",
                          }}
                        >
                          {isOverdue
                            ? "⚠️ Vencida"
                            : `Vence: ${new Date(r.due_date).toLocaleDateString("es-VE")}`}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: isOverdue ? "#FF2D55" : "#F0E8FF",
                            margin: 0,
                            fontFamily: "monospace",
                          }}
                        >
                          ${(r.balance_usd ?? 0).toFixed(2)}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: primary,
                            margin: "2px 0 0",
                            fontWeight: 600,
                          }}
                        >
                          Pagar →
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ─── PASO: FORMULARIO DE PAGO ─── */}
        {step === "pay" && (
          <>
            <button
              onClick={() => setStep("list")}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: 10,
                padding: "7px 14px",
                color: "#8A7AAA",
                fontSize: 12,
                cursor: "pointer",
                marginBottom: 18,
              }}
            >
              ← Volver
            </button>

            {/* Factura seleccionada */}
            <div
              style={{
                background: "rgba(255,45,85,0.06)",
                border: "1px solid rgba(255,45,85,0.15)",
                borderRadius: 14,
                padding: "14px 18px",
                marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 12, color: "#8A7AAA", margin: 0 }}>
                Pagando factura
              </p>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#F0E8FF",
                  margin: "4px 0 0",
                }}
              >
                {selected?.invoice_number}
              </p>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#FF2D55",
                  fontFamily: "monospace",
                  margin: "4px 0 0",
                }}
              >
                Saldo: ${(selected?.balance_usd ?? 0).toFixed(2)}
              </p>
            </div>

            {/* Tu nombre */}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Tu Nombre Completo *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Carlos Rodríguez"
              style={{
                width: "100%",
                background: "#120D1A",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "13px 15px",
                color: "#F0E8FF",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />

            {/* Método de pago */}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                display: "block",
                marginBottom: 10,
              }}
            >
              Método de Pago *
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  style={{
                    padding: "12px 6px",
                    borderRadius: 12,
                    textAlign: "center",
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.15s",
                    background:
                      method === m.id
                        ? `${primary}20`
                        : "rgba(255,255,255,0.04)",
                    outline:
                      method === m.id
                        ? `2px solid ${primary}60`
                        : "2px solid transparent",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{m.emoji}</div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: method === m.id ? primary : "#F0E8FF",
                      margin: 0,
                    }}
                  >
                    {m.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Monto */}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Monto (USD) *
            </label>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <span
                style={{
                  position: "absolute",
                  left: 15,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4A3A6A",
                  fontFamily: "monospace",
                  fontSize: 20,
                }}
              >
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "100%",
                  background: "#120D1A",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 12,
                  padding: "14px 14px 14px 34px",
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "monospace",
                  color: "#F0E8FF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Referencia */}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Número de Referencia *
            </label>
            <input
              value={reference}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Últimos 6 dígitos o código de confirmación"
              style={{
                width: "100%",
                background: "#120D1A",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "13px 15px",
                color: "#F0E8FF",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />

            {/* Teléfono */}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Tu Teléfono (opcional)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="04XX-1234567"
              style={{
                width: "100%",
                background: "#120D1A",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "13px 15px",
                color: "#F0E8FF",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />

            {/* Subir comprobante */}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#4A3A6A",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                display: "block",
                marginBottom: 10,
              }}
            >
              Foto del Comprobante (recomendado)
            </label>
            <label
              style={{
                display: "block",
                background: "rgba(255,255,255,0.04)",
                border: `2px dashed ${proof ? primary + "60" : "rgba(255,255,255,0.10)"}`,
                borderRadius: 14,
                padding: "22px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 24,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              {proof ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#00E5CC",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  ✓ {proof.name}
                </p>
              ) : (
                <>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
                  <p style={{ fontSize: 13, color: "#8A7AAA", margin: 0 }}>
                    Toca para subir foto del comprobante
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#4A3A6A",
                      margin: "4px 0 0",
                    }}
                  >
                    JPG, PNG — máx. 5MB
                  </p>
                </>
              )}
            </label>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(255,45,85,0.08)",
                  border: "1px solid rgba(255,45,85,0.20)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 13, color: "#FF2D55", margin: 0 }}>
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* Botón enviar */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: 14,
                border: "none",
                background:
                  isFormValid && !loading
                    ? `linear-gradient(135deg,${primary},#7C4DFF)`
                    : "rgba(255,255,255,0.05)",
                color: isFormValid && !loading ? "#fff" : "#4A3A6A",
                fontWeight: 700,
                fontSize: 16,
                cursor: isFormValid && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳ Enviando..." : "✓ Enviar Comprobante de Pago"}
            </button>
          </>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#4A3A6A",
            marginTop: 32,
          }}
        >
          Powered by <strong style={{ color: "#E040FB" }}>LUMIS</strong> · Pago
          seguro
        </p>
      </div>
    </div>
  );
}
