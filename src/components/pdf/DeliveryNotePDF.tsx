import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottom: "2px solid #E040FB",
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    width: 200,
  },
  logoPlaceholder: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7C4DFF",
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F0A12",
    marginBottom: 5,
  },
  textRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 80,
    fontWeight: "bold",
    color: "#666666",
  },
  value: {
    flex: 1,
  },
  headerInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
    justifyContent: "flex-start",
  },
  headerLabel: {
    width: 70,
    fontWeight: "bold",
    color: "#666666",
    textAlign: "right",
    paddingRight: 10,
  },
  headerValue: {
    width: 100,
    textAlign: "left",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#F5EEFF",
    color: "#7C4DFF",
    padding: 5,
    marginBottom: 10,
  },
  table: {
    width: "100%",
    flexDirection: "column",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #7C4DFF",
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: "bold",
    color: "#7C4DFF",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EEEEEE",
    paddingVertical: 8,
  },
  col1: { width: "15%" }, // Cod/SKU
  col2: { width: "40%" }, // Desc
  col3: { width: "15%", textAlign: "center" }, // Qty
  col4: { width: "15%", textAlign: "right" }, // Unit Price
  col5: { width: "15%", textAlign: "right" }, // Total
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#666666",
  },
  totalValueHigh: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#E040FB",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999999",
    fontSize: 8,
    borderTop: "1px solid #EEEEEE",
    paddingTop: 10,
  },
  signatureBox: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  signatureLine: {
    width: 200,
    borderTop: "1px solid #333333",
    textAlign: "center",
    paddingTop: 5,
  },
});

interface DeliveryNoteProps {
  order: any;
  items: any[];
  company: any;
  partner: any;
}

export const DeliveryNotePDF = ({
  order,
  items,
  company,
  partner,
}: DeliveryNoteProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoPlaceholder}>
            {company?.name || "Distribuidora S.A."}
          </Text>
          <Text>{company?.rif || "J-XXXXXXXX-X"}</Text>
          <Text>Documento de Entrega Oficial</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.title}>NOTA DE ENTREGA</Text>
          <View style={styles.headerInfoRow}>
            <Text style={styles.headerLabel}>N° Pedido:</Text>
            <Text style={styles.headerValue}>{order.order_number}</Text>
          </View>
          <View style={styles.headerInfoRow}>
            <Text style={styles.headerLabel}>Fecha:</Text>
            <Text style={styles.headerValue}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.headerInfoRow}>
            <Text style={styles.headerLabel}>Estado:</Text>
            <Text style={styles.headerValue}>{order.status}</Text>
          </View>
        </View>
      </View>

      {/* CLIENT DETAILS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
        <View style={styles.textRow}>
          <Text style={styles.label}>Razón Social:</Text>
          <Text style={styles.value}>{partner?.name || "N/A"}</Text>
        </View>
        <View style={styles.textRow}>
          <Text style={styles.label}>RIF:</Text>
          <Text style={styles.value}>{partner?.rif || "N/A"}</Text>
        </View>
        <View style={styles.textRow}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>
            {partner?.city || ""} {partner?.address || ""}
          </Text>
        </View>
        <View style={styles.textRow}>
          <Text style={styles.label}>Contacto:</Text>
          <Text style={styles.value}>
            {partner?.phone || "N/A"} - {partner?.email || "N/A"}
          </Text>
        </View>
      </View>

      {/* ITEMS TABLE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DETALLE DE PRODUCTOS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>SKU</Text>
            <Text style={styles.col2}>Descripción</Text>
            <Text style={styles.col3}>Cant.</Text>
            <Text style={styles.col4}>Precio Und.</Text>
            <Text style={styles.col5}>Subtotal</Text>
          </View>

          {items.map((item, i) => {
            const priceBs = (Number(item.price_usd) * Number(order.exchange_rate || 1));
            const subtotalBs = (Number(item.subtotal) * Number(order.exchange_rate || 1));
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{item.products?.sku || "N/A"}</Text>
                <Text style={styles.col2}>
                  {item.products?.name || "Producto"}
                </Text>
                <Text style={styles.col3}>{item.qty}</Text>
                <Text style={styles.col4}>
                  Bs. {priceBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.col5}>
                  Bs. {subtotalBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* TOTALS */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL BS:</Text>
            <Text style={styles.totalValueHigh}>
              Bs. {Number(order.total_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL USD:</Text>
            <Text>
              ${Number(order.total_usd || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* SIGNATURES */}
      <View style={styles.signatureBox}>
        <View>
          <Text style={styles.signatureLine}>Entregado por (Empresa)</Text>
        </View>
        <View>
          <Text style={styles.signatureLine}>Recibido por (Cliente)</Text>
          <Text
            style={{
              textAlign: "center",
              fontSize: 8,
              marginTop: 4,
              color: "#666",
            }}
          >
            Sello y Firma
          </Text>
        </View>
      </View>

      {/* FOOTER */}
      <Text style={styles.footer} fixed>
        Este documento es una nota de entrega generada por LUMIS ERP/CRM.
      </Text>
    </Page>
  </Document>
);
