import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type {
  InfoSheet,
  InfoSheetProductSection,
  InfoSheetRenewalItem,
  InfoSheetStatus,
} from "@/lib/types/info-sheet";

const BLUE = "#0077B6";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    fontSize: 11,
    color: "#333",
    fontFamily: "Helvetica",
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
    paddingBottom: 8,
    marginBottom: 12,
  },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BLUE },
  headerSub: { color: "#666", fontSize: 10, marginTop: 2 },
  section: { marginBottom: 10 },
  sectionTitle: {
    backgroundColor: BLUE,
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  sectionContent: { paddingHorizontal: 10, paddingVertical: 3 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { fontFamily: "Helvetica-Bold", color: "#555", marginRight: 6 },
  productBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginBottom: 10,
  },
  productBoxHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  productBoxBody: { paddingVertical: 6, paddingHorizontal: 10 },
  subTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#333",
    marginTop: 6,
    marginBottom: 4,
  },
  renewalRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 4,
  },
  renewalTop: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  muted: { color: "#666", fontSize: 10 },
  badge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  badgeActive: { backgroundColor: "#d4edda", color: "#155724" },
  badgeExpired: { backgroundColor: "#f8d7da", color: "#721c24" },
  badgePending: { backgroundColor: "#fff3cd", color: "#856404" },
  highlightBox: {
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: BLUE,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  hbLine: { marginVertical: 3 },
  link: { color: BLUE, textDecoration: "underline" },
  emergencyBox: {
    backgroundColor: "#fff3f3",
    borderWidth: 1,
    borderColor: "#cc0000",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    alignItems: "center",
  },
  emergencyTitle: { color: "#cc0000", fontFamily: "Helvetica-Bold", fontSize: 12 },
  footer: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  footerText: { fontSize: 9, color: "#999" },
  bold: { fontFamily: "Helvetica-Bold" },
});

function badgeStyle(status: InfoSheetStatus) {
  if (status === "ACTIVE") return styles.badgeActive;
  if (status === "EXPIRED") return styles.badgeExpired;
  return styles.badgePending;
}

function RenewalRow({ item }: { item: InfoSheetRenewalItem }) {
  return (
    <View style={styles.renewalRow}>
      <View style={styles.renewalTop}>
        <Text style={styles.bold}>{item.name} </Text>
        {item.cycle ? <Text style={styles.muted}>(Every {item.cycle}) </Text> : null}
        <Text style={[styles.badge, badgeStyle(item.status)]}>{item.status}</Text>
      </View>
      <Text style={styles.muted}>
        {item.status === "PENDING"
          ? "Pending Install"
          : `Next renewal: ${item.nextDate ?? "N/A"}`}
      </Text>
      {item.address ? (
        <Text style={styles.muted}>Ship to: {item.address}</Text>
      ) : null}
    </View>
  );
}

function ProductBox({ section }: { section: InfoSheetProductSection }) {
  return (
    <View style={styles.productBox}>
      <View style={styles.productBoxHeader}>
        <Text style={styles.bold}>{section.name}</Text>
        {section.nickname ? (
          <Text style={{ color: "#666", marginLeft: 6 }}>({section.nickname})</Text>
        ) : null}
      </View>
      <View style={styles.productBoxBody}>
        <Text style={styles.subTitle}>Address</Text>
        <Text style={{ marginBottom: 10 }}>{section.address ?? ""}</Text>

        {section.zoneFilterDesc ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subTitle}>Zone Info</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Zone:</Text>
              <Text>{section.zone}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Filters:</Text>
              <Text>{section.zoneFilterDesc}</Text>
            </View>
          </View>
        ) : null}

        {section.renewalItems.length > 0 ? (
          <View>
            <Text style={styles.subTitle}>Subscription Details</Text>
            {section.renewalItems.map((item, index) => (
              <RenewalRow key={index} item={item} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function InfoSheetDocument({ data }: { data: InfoSheet }) {
  const year = new Date().getUTCFullYear();

  return (
    <Document title="Spring Aqua Customer Info Sheet">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Spring Aqua</Text>
          <Text style={styles.headerSub}>Customer Information Sheet</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={{ marginRight: 16 }}>{data.customerName}</Text>
              <Text style={styles.label}>Phone:</Text>
              <Text>{data.customerPhone}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text>{data.customerEmail}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={{ flex: 1 }}>{data.customerAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.sectionContent}>
            {data.productSections.map((section, index) => (
              <ProductBox key={index} section={section} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Login Information</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.hbLine}>
              <Text style={styles.bold}>Portal URL: </Text>
              <Text style={styles.link}>{data.portalUrl}</Text>
            </Text>
            <Text style={styles.hbLine}>
              <Text style={styles.bold}>Login Email: </Text>
              {data.customerEmail}
            </Text>
            <Text style={styles.hbLine}>
              <Text style={styles.bold}>Instructions: </Text>
              Visit the portal URL above and log in with your email and the password you
              set up. If you haven&apos;t set a password yet, use the &quot;Forgot
              Password&quot; link to create one.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support &amp; Resources</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.hbLine}>
              <Text style={styles.bold}>Product Support: </Text>
              <Text style={styles.link}>{data.productSupportUrl}</Text>
            </Text>
            <Text style={styles.hbLine}>
              <Text style={styles.bold}>Customer Service: </Text>
              <Text style={styles.link}>{data.customerServiceUrl}</Text>
            </Text>
            <Text style={styles.hbLine}>
              Visit the customer service link above to create a support ticket
            </Text>
          </View>
        </View>

        {data.emergencyPhone ? (
          <View style={styles.section}>
            <View style={styles.emergencyBox}>
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
              <Text>
                For urgent assistance, text or call:{" "}
                <Text style={styles.bold}>{data.emergencyPhone}</Text>
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {year} Spring Aqua. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            This document was auto-generated on {data.generatedDate}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function renderInfoSheetPdf(data: InfoSheet): Promise<Buffer> {
  return renderToBuffer(<InfoSheetDocument data={data} />);
}
