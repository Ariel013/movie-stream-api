import { PrismaClient, AboGroup, RhFactor } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const HASH = 10;

  // ── 1. Blood types ─────────────────────────────────────────────────────────
  const bloodTypes = [
    { aboGroup: AboGroup.O,  rhFactor: RhFactor.POSITIVE, label: 'O+',  compatibleDonor: ['O+', 'O-'] },
    { aboGroup: AboGroup.O,  rhFactor: RhFactor.NEGATIVE, label: 'O-',  compatibleDonor: ['O-'] },
    { aboGroup: AboGroup.A,  rhFactor: RhFactor.POSITIVE, label: 'A+',  compatibleDonor: ['A+', 'A-', 'O+', 'O-'] },
    { aboGroup: AboGroup.A,  rhFactor: RhFactor.NEGATIVE, label: 'A-',  compatibleDonor: ['A-', 'O-'] },
    { aboGroup: AboGroup.B,  rhFactor: RhFactor.POSITIVE, label: 'B+',  compatibleDonor: ['B+', 'B-', 'O+', 'O-'] },
    { aboGroup: AboGroup.B,  rhFactor: RhFactor.NEGATIVE, label: 'B-',  compatibleDonor: ['B-', 'O-'] },
    { aboGroup: AboGroup.AB, rhFactor: RhFactor.POSITIVE, label: 'AB+', compatibleDonor: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { aboGroup: AboGroup.AB, rhFactor: RhFactor.NEGATIVE, label: 'AB-', compatibleDonor: ['A-', 'B-', 'AB-', 'O-'] },
  ];

  const btMap: Record<string, string> = {};
  for (const bt of bloodTypes) {
    const record = await prisma.bloodType.upsert({
      where: { aboGroup_rhFactor: { aboGroup: bt.aboGroup, rhFactor: bt.rhFactor } },
      update: {},
      create: { aboGroup: bt.aboGroup, rhFactor: bt.rhFactor, label: bt.label, compatibleDonor: bt.compatibleDonor },
    });
    btMap[bt.label] = record.id;
  }
  console.log('✅ Blood types seeded');

  // ── 2. Régions de Côte d'Ivoire ────────────────────────────────────────────
  const abidjan       = await upsertRegion('CI-ABJ',  "District d'Abidjan");
  const valleeBandama = await upsertRegion('CI-VB',   'Vallée du Bandama (Bouaké)');
  const bassSassandra = await upsertRegion('CI-BS',   'Bas-Sassandra (San-Pédro)');
  const savanes       = await upsertRegion('CI-SAV',  'Savanes (Korhogo)');
  const gohDjiboua    = await upsertRegion('CI-GD',   'Gôh-Djiboua (Gagnoa)');
  console.log('✅ Régions seeded');

  // ── 3. Banques de sang ────────────────────────────────────────────────────
  const cnts = await upsertFacility({
    type: 'BLOOD_BANK', code: 'CNTS-ABJ',
    name: 'Centre National de Transfusion Sanguine',
    address: "Bd de la Corniche, Abidjan (Plateau)",
    regionId: abidjan.id,
    phone: '+225 27 20 21 00 00', email: 'contact@cnts.ci',
    lat: 5.321, lng: -4.017,
  });
  await upsertFacility({
    type: 'BLOOD_BANK', code: 'BB-COCODY',
    name: 'Banque de Sang CHU de Cocody',
    address: 'Av. Christiani, Cocody, Abidjan',
    regionId: abidjan.id,
    phone: '+225 27 22 48 10 00', email: 'banque.sang@chu-cocody.ci',
    lat: 5.359, lng: -3.988,
  });
  await upsertFacility({
    type: 'BLOOD_BANK', code: 'BB-TREICH',
    name: 'Banque de Sang CHU de Treichville',
    address: "Av. Giscard d'Estaing, Treichville, Abidjan",
    regionId: abidjan.id,
    phone: '+225 27 21 24 00 00', email: 'banque.sang@chu-treichville.ci',
    lat: 5.296, lng: -4.011,
  });
  await upsertFacility({
    type: 'BLOOD_BANK', code: 'BB-BOUAKE',
    name: 'Banque de Sang CHR de Bouaké',
    address: 'Av. du Général de Gaulle, Bouaké',
    regionId: valleeBandama.id,
    phone: '+225 27 31 63 10 00', email: 'banque.sang@chr-bouake.ci',
    lat: 7.691, lng: -5.031,
  });
  await upsertFacility({
    type: 'BLOOD_BANK', code: 'BB-SANPEDRO',
    name: 'Banque de Sang CHR de San-Pédro',
    address: 'Cité Bac, San-Pédro',
    regionId: bassSassandra.id,
    phone: '+225 27 34 71 10 00', email: 'banque.sang@chr-sanpedro.ci',
    lat: 4.748, lng: -6.636,
  });
  await upsertFacility({
    type: 'BLOOD_BANK', code: 'BB-KORHOGO',
    name: 'Banque de Sang CHR de Korhogo',
    address: 'Rue du Commerce, Korhogo',
    regionId: savanes.id,
    phone: '+225 27 36 86 10 00', email: 'banque.sang@chr-korhogo.ci',
    lat: 9.458, lng: -5.629,
  });
  console.log('✅ Banques de sang seeded');

  // ── 4. Hôpitaux ────────────────────────────────────────────────────────────
  const chuCocody = await upsertFacility({
    type: 'HOSPITAL', code: 'CHU-COCODY',
    name: 'CHU de Cocody',
    address: 'Av. Christiani, Cocody, Abidjan',
    regionId: abidjan.id,
    phone: '+225 27 22 48 10 00', email: 'direction@chu-cocody.ci',
    lat: 5.359, lng: -3.988,
  });
  await upsertFacility({
    type: 'HOSPITAL', code: 'CHU-TRCHV',
    name: 'CHU de Treichville',
    address: "Av. Giscard d'Estaing, Treichville, Abidjan",
    regionId: abidjan.id,
    phone: '+225 27 21 24 00 00', email: 'direction@chu-treichville.ci',
    lat: 5.296, lng: -4.011,
  });
  await upsertFacility({
    type: 'HOSPITAL', code: 'CHU-YOPO',
    name: 'CHU de Yopougon',
    address: 'Quartier Sideci, Yopougon, Abidjan',
    regionId: abidjan.id,
    phone: '+225 27 23 50 00 00', email: 'direction@chu-yopougon.ci',
    lat: 5.353, lng: -4.073,
  });
  await upsertFacility({
    type: 'HOSPITAL', code: 'HOP-GAGNOA',
    name: 'Hôpital Général de Gagnoa',
    address: 'Quartier Résidentiel, Gagnoa',
    regionId: gohDjiboua.id,
    phone: '+225 27 32 77 10 00', email: 'direction@hg-gagnoa.ci',
    lat: 5.930, lng: -5.950,
  });
  console.log('✅ Hôpitaux seeded');

  // ── 5. Utilisateurs ────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@hemosafe.ci' },
    update: {},
    create: {
      email: 'admin@hemosafe.ci',
      passwordHash: await bcrypt.hash('Admin1234!', HASH),
      role: 'ADMIN', firstName: 'Kouamé', lastName: 'Yao', isActive: true,
    },
  });
  await prisma.user.upsert({
    where: { email: 'hopital@hemosafe.ci' },
    update: {},
    create: {
      email: 'hopital@hemosafe.ci',
      passwordHash: await bcrypt.hash('Hospital1234!', HASH),
      role: 'HOSPITAL', firstName: 'Dr. Aya', lastName: 'Koné',
      facilityId: chuCocody.id, isActive: true,
    },
  });
  await prisma.user.upsert({
    where: { email: 'banque@hemosafe.ci' },
    update: {},
    create: {
      email: 'banque@hemosafe.ci',
      passwordHash: await bcrypt.hash('BloodBank1234!', HASH),
      role: 'BLOOD_BANK', firstName: 'Adjoua', lastName: 'Bamba',
      facilityId: cnts.id, isActive: true,
    },
  });
  console.log('✅ Utilisateurs seeded');

  // ── 6. Stock de démonstration (CNTS) ───────────────────────────────────────
  const stockDemo: Array<{ label: string; qty: number }> = [
    { label: 'O+', qty: 42 }, { label: 'O-', qty: 8 },
    { label: 'A+', qty: 28 }, { label: 'A-', qty: 5 },
    { label: 'B+', qty: 19 }, { label: 'B-', qty: 3 },
    { label: 'AB+', qty: 11 }, { label: 'AB-', qty: 2 },
  ];
  const now = new Date();
  for (const { label, qty } of stockDemo) {
    const btId = btMap[label];
    for (let i = 0; i < qty; i++) {
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30 + Math.floor(Math.random() * 60));
      const code = `CNTS-${label.replace('+', 'P').replace('-', 'N')}-${String(i + 1).padStart(4, '0')}`;
      await prisma.bloodBag.upsert({
        where: { code },
        update: {},
        create: {
          code,
          bloodTypeId: btId,
          bloodBankId: cnts.id,
          volumeMl: 450,
          collectedAt: now,
          expiresAt,
          status: 'AVAILABLE',
        },
      });
    }
  }
  console.log('✅ Stock CNTS seeded (118 poches)');

  console.log('');
  console.log('  ADMIN      → admin@hemosafe.ci    / Admin1234!');
  console.log('  HOSPITAL   → hopital@hemosafe.ci  / Hospital1234!');
  console.log('  BLOOD_BANK → banque@hemosafe.ci   / BloodBank1234!');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function upsertRegion(code: string, name: string) {
  return prisma.region.upsert({
    where: { code },
    update: {},
    create: { code, name },
  });
}

async function upsertFacility(f: {
  type: 'HOSPITAL' | 'BLOOD_BANK';
  code: string; name: string; address: string;
  regionId: string; phone: string; email: string;
  lat: number; lng: number;
}) {
  const record = await prisma.facility.upsert({
    where: { code: f.code },
    update: {},
    create: {
      type: f.type as any,
      code: f.code, name: f.name, address: f.address,
      regionId: f.regionId, phone: f.phone, email: f.email,
    },
  });
  // Set PostGIS location via raw SQL (Prisma can't handle geography type directly)
  await prisma.$executeRaw`
    UPDATE facilities
    SET location = ST_SetSRID(ST_MakePoint(${f.lng}, ${f.lat}), 4326)::geography
    WHERE id = ${record.id}::uuid
  `;
  return record;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
