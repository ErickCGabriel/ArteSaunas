import fs from "node:fs";
import path from "node:path";

import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { formatCentsToBRL } from "@/lib/currency";
import type { Budget, BudgetItem, Contact } from "@/db/schema";

const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: "#1a1a1a",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottom: "2 solid #b07d3f",
    paddingBottom: 16,
  },
  logo: { width: 140, height: 33, marginBottom: 4 },
  brandSub: { fontSize: 9, color: "#555", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  budgetNumber: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#8a5a24",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 80, color: "#555" },
  value: { flex: 1 },
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #ccc",
    paddingBottom: 4,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottom: "0.5 solid #eee",
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colUnitPrice: { width: 80, textAlign: "right" },
  colSubtotal: { width: 80, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 8,
    borderTop: "1 solid #333",
  },
  totalLabel: { fontFamily: "Helvetica-Bold", marginRight: 12 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#8a5a24" },
  notes: { marginTop: 4, color: "#333", lineHeight: 1.4 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
    borderTop: "0.5 solid #ddd",
    paddingTop: 8,
  },
});

const STATUS_LABEL: Record<Budget["status"], string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function BudgetPdf({
  budget,
  items,
  contact,
}: {
  budget: Budget;
  items: BudgetItem[];
  contact: Contact;
}) {
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );

  return (
    <Document
      title={`Orçamento ${budget.number} — ${contact.name}`}
      author="Arte Saunas"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Image src={logoBuffer} style={styles.logo} />
            <Text style={styles.brandSub}>Orçamento de serviços</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.budgetNumber}>{budget.number}</Text>
            <Text style={styles.brandSub}>
              Emitido em {formatDate(budget.createdAt)}
            </Text>
            <Text style={styles.brandSub}>
              Status: {STATUS_LABEL[budget.status]}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{contact.name}</Text>
          </View>
          {contact.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.value}>{contact.phone}</Text>
            </View>
          )}
          {contact.email && (
            <View style={styles.row}>
              <Text style={styles.label}>E-mail</Text>
              <Text style={styles.value}>{contact.email}</Text>
            </View>
          )}
          {contact.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>{contact.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{budget.title}</Text>
          {budget.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Local</Text>
              <Text style={styles.value}>{budget.address}</Text>
            </View>
          )}

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Descrição</Text>
              <Text style={styles.colQty}>Qtd.</Text>
              <Text style={styles.colUnitPrice}>Valor unit.</Text>
              <Text style={styles.colSubtotal}>Subtotal</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnitPrice}>
                  {formatCentsToBRL(item.unitPriceCents)}
                </Text>
                <Text style={styles.colSubtotal}>
                  {formatCentsToBRL(item.quantity * item.unitPriceCents)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCentsToBRL(total)}</Text>
          </View>
        </View>

        {budget.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.notes}>{budget.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Arte Saunas · Orçamento {budget.number} · Documento gerado
          automaticamente pelo sistema de gestão
        </Text>
      </Page>
    </Document>
  );
}
