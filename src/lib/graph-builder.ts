/**
 * Graph Builder — transforms bill analysis data into force-graph format
 * Used by BillGraph component (react-force-graph-2d)
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'bill' | 'amendment' | 'related-bill' | 'sponsor' | 'cosponsor' | 'donor' | 'pac';
  party?: string;
  amount?: number;
  color: string;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const COLORS = {
  bill: '#3b82f6',         // blue
  amendment: '#f97316',    // orange
  relatedBill: '#8b5cf6',  // purple
  democrat: '#2563eb',     // blue
  republican: '#dc2626',   // red
  independent: '#6b7280',  // gray
  donor: '#eab308',        // gold
  pac: '#10b981',          // emerald
  link: '#d1d5db',         // light gray
  moneyLink: '#eab308',    // gold
};

export function buildBillGraph(data: any): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  const bill = data.bill;
  const sponsors = bill.metadata?.sponsors || [];
  const cosponsors = data.aiContext?.metadata?.cosponsors || [];
  const amendments = data.aiContext?.dependencies?.filter((d: any) => d.type === 'amendment') || [];
  const relatedBills = data.aiContext?.dependencies?.filter((d: any) => d.type === 'bill') || [];
  const sponsorDonors = data.sponsorDonors || [];

  // Center node — the bill
  const billNodeId = `bill:${bill.id}`;
  nodes.push({
    id: billNodeId,
    label: bill.title.length > 50 ? bill.title.substring(0, 50) + '...' : bill.title,
    type: 'bill',
    color: COLORS.bill,
    size: 20,
  });
  nodeIds.add(billNodeId);

  // Sponsors
  sponsors.forEach((s: any) => {
    const nodeId = `sponsor:${s.bioguideId || s.fullName}`;
    if (nodeIds.has(nodeId)) return;
    nodes.push({
      id: nodeId,
      label: s.fullName,
      type: 'sponsor',
      party: s.party,
      color: s.party === 'D' ? COLORS.democrat : s.party === 'R' ? COLORS.republican : COLORS.independent,
      size: 14,
    });
    nodeIds.add(nodeId);
    links.push({
      source: nodeId,
      target: billNodeId,
      label: 'Sponsored',
      color: COLORS.link,
    });

    // Donor connections for this sponsor
    const donorData = sponsorDonors.find((sd: any) => sd.sponsor?.bioguideId === s.bioguideId);
    if (donorData?.donorProfile?.topDonors?.employers) {
      donorData.donorProfile.topDonors.employers.slice(0, 5).forEach((d: any) => {
        const donorId = `donor:${d.employer}`;
        if (!nodeIds.has(donorId)) {
          nodes.push({
            id: donorId,
            label: d.employer,
            type: 'donor',
            amount: d.total,
            color: COLORS.donor,
            size: Math.max(6, Math.min(12, Math.log10(d.total + 1) * 2)),
          });
          nodeIds.add(donorId);
        }
        links.push({
          source: donorId,
          target: nodeId,
          label: `$${(d.total / 1000).toFixed(0)}K`,
          color: COLORS.moneyLink,
        });
      });
    }

    // Super PAC connections
    if (donorData?.donorProfile?.independentExpenditures?.expenditures) {
      donorData.donorProfile.independentExpenditures.expenditures.slice(0, 3).forEach((e: any) => {
        const pacId = `pac:${e.committee}`;
        if (!nodeIds.has(pacId)) {
          nodes.push({
            id: pacId,
            label: e.committee.length > 30 ? e.committee.substring(0, 30) + '...' : e.committee,
            type: 'pac',
            amount: e.amount,
            color: COLORS.pac,
            size: Math.max(6, Math.min(12, Math.log10(e.amount + 1) * 2)),
          });
          nodeIds.add(pacId);
        }
        links.push({
          source: pacId,
          target: nodeId,
          label: `${e.supportOppose} $${(e.amount / 1000).toFixed(0)}K`,
          color: e.supportOppose === 'Support' ? '#10b981' : '#ef4444',
        });
      });
    }
  });

  // Top cosponsors (limit to 10 to keep graph readable)
  cosponsors.slice(0, 10).forEach((c: any) => {
    const nodeId = `cosponsor:${c.bioguideId || c.fullName}`;
    if (nodeIds.has(nodeId)) return;
    nodes.push({
      id: nodeId,
      label: c.fullName,
      type: 'cosponsor',
      party: c.party,
      color: c.party === 'D' ? COLORS.democrat : c.party === 'R' ? COLORS.republican : COLORS.independent,
      size: 8,
    });
    nodeIds.add(nodeId);
    links.push({
      source: nodeId,
      target: billNodeId,
      label: 'Cosponsored',
      color: COLORS.link,
    });
  });

  // Amendments (limit to 5)
  amendments
    .filter((a: any) => a.summary && a.summary !== 'No description')
    .slice(0, 5)
    .forEach((a: any) => {
      const nodeId = `amendment:${a.id}`;
      if (nodeIds.has(nodeId)) return;
      nodes.push({
        id: nodeId,
        label: a.title,
        type: 'amendment',
        color: COLORS.amendment,
        size: 8,
      });
      nodeIds.add(nodeId);
      links.push({
        source: nodeId,
        target: billNodeId,
        label: 'Amends',
        color: COLORS.amendment,
      });
    });

  // Related bills (limit to 5)
  relatedBills.slice(0, 5).forEach((rb: any) => {
    const nodeId = `related:${rb.id}`;
    if (nodeIds.has(nodeId)) return;
    nodes.push({
      id: nodeId,
      label: rb.title.length > 40 ? rb.title.substring(0, 40) + '...' : rb.title,
      type: 'related-bill',
      color: COLORS.relatedBill,
      size: 10,
    });
    nodeIds.add(nodeId);
    links.push({
      source: nodeId,
      target: billNodeId,
      label: rb.relationship || 'Related',
      color: COLORS.relatedBill,
    });
  });

  return { nodes, links };
}
