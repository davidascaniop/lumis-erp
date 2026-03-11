export default function PortalNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0A12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "DM Sans, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2
          style={{ fontSize: 22, fontWeight: 800, color: "#F0E8FF", margin: 0 }}
        >
          Link no válido
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#8A7AAA",
            margin: "12px 0 0",
            lineHeight: 1.6,
          }}
        >
          Este link expiró o ya no está disponible.
          <br />
          Solicita uno nuevo a tu proveedor.
        </p>
        <div
          style={{
            marginTop: 32,
            fontSize: 11,
            color: "#4A3A6A",
          }}
        >
          Powered by <strong style={{ color: "#E040FB" }}>LUMIS</strong>
        </div>
      </div>
    </div>
  );
}
