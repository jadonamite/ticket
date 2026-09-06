import Link from "next/link";

export function AppFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--xa-hairline)",
        background: "var(--xa-paper)",
        padding: "24px 0",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 13,
          color: "var(--xa-ink-2)",
        }}
      >
        <span>© 2026 Ticket &bull; Encrypted, verifiable prize pool</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/terms-of-service" style={{ color: "inherit", textDecoration: "none" }}>
            Terms &amp; Conditions
          </Link>
          <span aria-hidden style={{ opacity: 0.4 }}>|</span>
          <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <span aria-hidden style={{ opacity: 0.4 }}>|</span>
          <a
            href="https://github.com/jadonamite/ticket"
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
