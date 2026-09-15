import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();
const DEMO_RESELLER_PASSWORD = "revendedora123";

// Catálogo con id fijo ("seed-...") para poder actualizarlo con upsert en
// cada deploy sin duplicar productos ni pisar lo que el negocio haya
// editado a mano desde /admin/productos.
const catalogo = [
  // Remeras
  {
    id: "seed-remera-basica-blanca",
    name: "Remera básica blanca",
    description: "Remera de algodón peinado 24/1, corte clásico, básica infaltable.",
    price: 13500,
    category: "Remeras",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  },
  {
    id: "seed-remera-basica-negra",
    name: "Remera básica negra",
    description: "Remera de algodón peinado 24/1, corte clásico, en color negro.",
    price: 13500,
    category: "Remeras",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  },
  {
    id: "seed-remera-basica-gris",
    name: "Remera básica gris melange",
    description: "Remera de algodón peinado, gris melange, corte clásico.",
    price: 13500,
    category: "Remeras",
    stock: 26,
    imageUrl: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
  },
  {
    id: "seed-remera-estampada-floral",
    name: "Remera estampada floral",
    description: "Remera con estampa floral exclusiva, tela suave y fresca.",
    price: 14800,
    category: "Remeras",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
  },
  {
    id: "seed-remera-oversize-rayada",
    name: "Remera oversize rayada",
    description: "Remera oversize a rayas, tela liviana, ideal para combinar.",
    price: 15000,
    category: "Remeras",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
  },
  {
    id: "seed-remera-canesu-bordado",
    name: "Remera con canesú bordado",
    description: "Remera con detalle de bordado en el canesú, corte regular.",
    price: 16500,
    category: "Remeras",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1622445275576-721325763afe?w=600&q=80",
  },
  {
    id: "seed-remera-cropped-basica",
    name: "Remera cropped básica",
    description: "Remera cropped de algodón, ideal para combinar con jean tiro alto.",
    price: 12500,
    category: "Remeras",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80",
  },
  {
    id: "seed-remera-manga-larga-lisa",
    name: "Remera manga larga lisa",
    description: "Remera de manga larga, algodón peinado, ideal para entretiempo.",
    price: 16000,
    category: "Remeras",
    stock: 19,
    imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
  },

  // Jeans
  {
    id: "seed-jean-mom-fit",
    name: "Jean mom fit clásico",
    description: "Jean tiro alto, fit mom, elastizado para mayor comodidad.",
    price: 29500,
    category: "Jeans",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
  },
  {
    id: "seed-jean-wide-leg",
    name: "Jean wide leg tiro alto",
    description: "Jean de pierna ancha, tiro alto, tendencia de la temporada.",
    price: 34000,
    category: "Jeans",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&q=80",
  },
  {
    id: "seed-jean-skinny-negro",
    name: "Jean skinny negro",
    description: "Jean chupín elastizado en color negro, tiro medio.",
    price: 28500,
    category: "Jeans",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
  },
  {
    id: "seed-jean-skinny-azul",
    name: "Jean skinny azul clásico",
    description: "Jean chupín elastizado, lavado azul clásico.",
    price: 28500,
    category: "Jeans",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&q=80",
  },
  {
    id: "seed-jean-recto-clasico",
    name: "Jean recto clásico",
    description: "Jean de corte recto, tiro medio, un básico versátil.",
    price: 29000,
    category: "Jeans",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600&q=80",
  },
  {
    id: "seed-jean-roturas",
    name: "Jean con roturas",
    description: "Jean mom fit con roturas en las rodillas, estilo urbano.",
    price: 31500,
    category: "Jeans",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80",
  },
  {
    id: "seed-jean-cargo-denim",
    name: "Jean cargo con bolsillos",
    description: "Jean estilo cargo con bolsillos laterales, tiro alto.",
    price: 32000,
    category: "Jeans",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1584865288642-42078afe6942?w=600&q=80",
  },

  // Pantalones
  {
    id: "seed-pantalon-cargo-verde",
    name: "Pantalón cargo verde militar",
    description: "Pantalón cargo con bolsillos, tela resistente, verde militar.",
    price: 27500,
    category: "Pantalones",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80",
  },
  {
    id: "seed-pantalon-palazzo",
    name: "Pantalón palazzo negro",
    description: "Pantalón palazzo de tela fluida, tiro alto, ideal para looks elegantes.",
    price: 27000,
    category: "Pantalones",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
  },
  {
    id: "seed-pantalon-vestir-gris",
    name: "Pantalón de vestir gris",
    description: "Pantalón de vestir de tela con caída, ideal para looks formales.",
    price: 28500,
    category: "Pantalones",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1594619336195-390dfab99c0d?w=600&q=80",
  },
  {
    id: "seed-jogger-cargo",
    name: "Jogger cargo de friza",
    description: "Pantalón jogger cargo, friza interior, puños en botamanga.",
    price: 24500,
    category: "Pantalones",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",
  },
  {
    id: "seed-pantalon-capri",
    name: "Pantalón capri elastizado",
    description: "Pantalón capri de gabardina elastizada, tiro alto.",
    price: 23500,
    category: "Pantalones",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80",
  },

  // Buzos
  {
    id: "seed-buzo-canguro-gris",
    name: "Buzo canguro gris melange",
    description: "Buzo con capucha y bolsillo canguro, friza interior, gris melange.",
    price: 25500,
    category: "Buzos",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
  },
  {
    id: "seed-buzo-canguro-negro",
    name: "Buzo canguro negro",
    description: "Buzo con capucha y bolsillo canguro, friza interior, negro.",
    price: 25500,
    category: "Buzos",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  },
  {
    id: "seed-buzo-oversize-crudo",
    name: "Buzo oversize crudo",
    description: "Buzo oversize de algodón frizado, color crudo, cuello redondo.",
    price: 26500,
    category: "Buzos",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&q=80",
  },
  {
    id: "seed-buzo-cierre-beige",
    name: "Buzo con cierre beige",
    description: "Buzo con cierre frontal, friza interior, color beige.",
    price: 27000,
    category: "Buzos",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80",
  },
  {
    id: "seed-buzo-estampado-rosa",
    name: "Buzo estampado rosa",
    description: "Buzo canguro con estampa exclusiva en tono rosa.",
    price: 26000,
    category: "Buzos",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=600&q=80",
  },
  {
    id: "seed-buzo-basico-bordo",
    name: "Buzo básico bordó",
    description: "Buzo básico sin capucha, friza interior, color bordó.",
    price: 24500,
    category: "Buzos",
    stock: 19,
    imageUrl: "https://images.unsplash.com/photo-1614251055880-ee96e4803393?w=600&q=80",
  },

  // Camperas
  {
    id: "seed-campera-jean",
    name: "Campera de jean clásica",
    description: "Campera de jean clásica, corte regular, para todo el año.",
    price: 34500,
    category: "Camperas",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
  },
  {
    id: "seed-campera-puffer",
    name: "Campera puffer negra",
    description: "Campera acolchada tipo puffer, súper abrigada, color negro.",
    price: 43000,
    category: "Camperas",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&q=80",
  },
  {
    id: "seed-campera-rompeviento",
    name: "Campera rompeviento",
    description: "Campera liviana rompeviento, ideal para entretiempo.",
    price: 26500,
    category: "Camperas",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
  },
  {
    id: "seed-campera-eco-cuero",
    name: "Campera eco-cuero cropped",
    description: "Campera de eco-cuero cropped, cierre frontal.",
    price: 39500,
    category: "Camperas",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&q=80",
  },
  {
    id: "seed-campera-parka",
    name: "Campera parka con capucha",
    description: "Campera parka larga con capucha desmontable, muy abrigada.",
    price: 46500,
    category: "Camperas",
    stock: 9,
    imageUrl: "https://images.unsplash.com/photo-1548624313-0396c75f4bb8?w=600&q=80",
  },

  // Medias
  {
    id: "seed-medias-pack-basicas",
    name: "Pack x3 medias básicas de algodón",
    description: "Pack de 3 pares de medias de algodón, varios colores.",
    price: 6500,
    category: "Medias",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80",
  },
  {
    id: "seed-medias-termicas",
    name: "Medias térmicas",
    description: "Medias térmicas afelpadas, ideales para el invierno.",
    price: 7500,
    category: "Medias",
    stock: 28,
    imageUrl: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80",
  },
  {
    id: "seed-canillera-deportiva",
    name: "Medias deportivas altas",
    description: "Medias deportivas altas, tela transpirable, pack x2.",
    price: 6800,
    category: "Medias",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=600&q=80",
  },
  {
    id: "seed-medias-gala",
    name: "Medias de gala finas",
    description: "Medias finas de nylon, ideales para looks de fiesta.",
    price: 5500,
    category: "Medias",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80",
  },

  // Cintos
  {
    id: "seed-cinturon-cuero-negro",
    name: "Cinturón de cuero negro",
    description: "Cinturón de cuero genuino, hebilla metálica, color negro.",
    price: 10500,
    category: "Cintos",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80",
  },
  {
    id: "seed-cinturon-cuero-marron",
    name: "Cinturón de cuero marrón",
    description: "Cinturón de cuero genuino, hebilla metálica, color marrón.",
    price: 10500,
    category: "Cintos",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1553704571-c09d0f5b0c3f?w=600&q=80",
  },
  {
    id: "seed-cinturon-ancho-hebilla",
    name: "Cinturón ancho con hebilla dorada",
    description: "Cinturón ancho de eco-cuero con hebilla dorada grande.",
    price: 11500,
    category: "Cintos",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&q=80",
  },
  {
    id: "seed-cinturon-trenzado",
    name: "Cinturón trenzado",
    description: "Cinturón de cuero trenzado, ideal para looks casuales.",
    price: 11000,
    category: "Cintos",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80",
  },

  // Blusas
  {
    id: "seed-blusa-blanca-clasica",
    name: "Blusa blanca clásica",
    description: "Blusa blanca de tela liviana, corte clásico, ideal para la oficina.",
    price: 18500,
    category: "Blusas",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1551048632-24e444b48a3e?w=600&q=80",
  },
  {
    id: "seed-blusa-estampada",
    name: "Blusa estampada floral",
    description: "Blusa liviana con estampa floral, mangas ¾.",
    price: 19000,
    category: "Blusas",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&q=80",
  },
  {
    id: "seed-blusa-satinada-negra",
    name: "Blusa satinada negra",
    description: "Blusa de tela satinada, ideal para looks de noche.",
    price: 21000,
    category: "Blusas",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80",
  },
  {
    id: "seed-blusa-volados",
    name: "Blusa con volados",
    description: "Blusa de gasa con volados en mangas.",
    price: 19500,
    category: "Blusas",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80",
  },
  {
    id: "seed-blusa-canesu-bordado",
    name: "Blusa con canesú bordado",
    description: "Blusa con detalle de bordado en el canesú, tela fresca.",
    price: 20500,
    category: "Blusas",
    stock: 13,
    imageUrl: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=600&q=80",
  },

  // Mochilas
  {
    id: "seed-mochila-urbana-negra",
    name: "Mochila urbana negra",
    description: "Mochila liviana ideal para uso diario, varios bolsillos.",
    price: 24500,
    category: "Mochilas",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  },
  {
    id: "seed-mochila-mini-rosa",
    name: "Mochila mini rosa",
    description: "Mochila pequeña, ideal para salidas casuales.",
    price: 19500,
    category: "Mochilas",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1622560481156-01a35e3b6b1c?w=600&q=80",
  },
  {
    id: "seed-mochila-deportiva",
    name: "Mochila deportiva gris",
    description: "Mochila deportiva resistente al agua, compartimento para calzado.",
    price: 26500,
    category: "Mochilas",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2645?w=600&q=80",
  },
  {
    id: "seed-mochila-cuero-eco",
    name: "Mochila de eco-cuero marrón",
    description: "Mochila de eco-cuero, diseño clásico, ideal para el día a día.",
    price: 27500,
    category: "Mochilas",
    stock: 11,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  },

  // Perfumes
  {
    id: "seed-perfume-floral-50",
    name: "Perfume floral 50ml",
    description: "Fragancia floral femenina, larga duración, 50ml.",
    price: 15500,
    category: "Perfumes",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80",
  },
  {
    id: "seed-perfume-citrico-100",
    name: "Perfume cítrico 100ml",
    description: "Fragancia cítrica y fresca, 100ml.",
    price: 21500,
    category: "Perfumes",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
  },
  {
    id: "seed-perfume-amaderado-75",
    name: "Perfume amaderado 75ml",
    description: "Fragancia amaderada intensa, 75ml.",
    price: 18500,
    category: "Perfumes",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
  },
  {
    id: "seed-perfume-vainilla-50",
    name: "Perfume dulce vainilla 50ml",
    description: "Fragancia dulce con notas de vainilla, 50ml.",
    price: 15500,
    category: "Perfumes",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1595425964272-3a0d13a2e5f9?w=600&q=80",
  },
  {
    id: "seed-perfume-edicion-especial",
    name: "Perfume edición especial 100ml",
    description: "Fragancia de edición limitada, frasco de diseño, 100ml.",
    price: 24500,
    category: "Perfumes",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=600&q=80",
  },

  // Ropa interior
  {
    id: "seed-conjunto-encaje-negro",
    name: "Conjunto de encaje negro",
    description: "Conjunto de ropa interior de encaje, corpiño y bombacha.",
    price: 16500,
    category: "Ropa interior",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1571908599407-cdb918ed83bf?w=600&q=80",
  },
  {
    id: "seed-conjunto-algodon-basico",
    name: "Conjunto básico de algodón",
    description: "Conjunto de ropa interior de algodón, cómodo para el día a día.",
    price: 12500,
    category: "Ropa interior",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1566958769312-82cef41d19ef?w=600&q=80",
  },
  {
    id: "seed-conjunto-encaje-rosa",
    name: "Conjunto de encaje rosa",
    description: "Conjunto de ropa interior de encaje en tono rosa.",
    price: 16500,
    category: "Ropa interior",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80",
  },
  {
    id: "seed-conjunto-deportivo",
    name: "Conjunto deportivo sin aros",
    description: "Conjunto de ropa interior deportivo, top sin aros y bombacha.",
    price: 14500,
    category: "Ropa interior",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80",
  },
  {
    id: "seed-conjunto-satinado",
    name: "Conjunto satinado",
    description: "Conjunto de ropa interior satinado, corte clásico.",
    price: 15500,
    category: "Ropa interior",
    stock: 17,
    imageUrl: "https://images.unsplash.com/photo-1608234808654-2a8875faa7fd?w=600&q=80",
  },

  // Pijamas
  {
    id: "seed-pijama-short-estampado",
    name: "Pijama short estampado",
    description: "Conjunto de remera y short de algodón con estampa.",
    price: 17500,
    category: "Pijamas",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600&q=80",
  },
  {
    id: "seed-pijama-largo-invierno",
    name: "Pijama largo de invierno",
    description: "Conjunto de pijama largo, tela afelpada, ideal para el frío.",
    price: 22500,
    category: "Pijamas",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=600&q=80",
  },
  {
    id: "seed-camison-satinado",
    name: "Camisón satinado",
    description: "Camisón de tela satinada, tiras regulables.",
    price: 18500,
    category: "Pijamas",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1616763355603-9755a640a287?w=600&q=80",
  },
  {
    id: "seed-pijama-short-remera",
    name: "Conjunto short y remera básico",
    description: "Conjunto de pijama básico, remera y short de algodón.",
    price: 16500,
    category: "Pijamas",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1617331721458-bd3bd3f9c7f8?w=600&q=80",
  },
  {
    id: "seed-pijama-polar",
    name: "Pijama polar",
    description: "Conjunto de pijama de polar suave, ideal para el invierno.",
    price: 23500,
    category: "Pijamas",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600&q=80",
  },
];

const resellers = [
  {
    name: "Ana García",
    email: "ana@example.com",
    phone: "+54 9 11 1111-1111",
    code: "ANA10",
    discountPercent: 10,
  },
  {
    name: "Belén Ríos",
    email: "belen@example.com",
    phone: "+54 9 11 2222-2222",
    code: "BELEN15",
    discountPercent: 15,
  },
];

async function main() {
  // Este script corre en CADA build/deploy (ver package.json), no solo la primera
  // vez. Si siempre insertara el catálogo/categorías/revendedoras de ejemplo,
  // cualquier cosa que el negocio borre desde el admin volvería a aparecer en el
  // próximo deploy. Por eso, la carga de datos de ejemplo se hace una única vez:
  // se usa la existencia de la fila de SiteSettings como marca de "ya se inicializó
  // esta base" (se crea más abajo, en el mismo run en que se cargan los ejemplos).
  const yaInicializada = Boolean(await prisma.siteSettings.findUnique({ where: { id: "singleton" } }));

  // Se crea de forma idempotente para evitar que varias páginas generadas en
  // paralelo durante "next build" compitan por crear la misma fila.
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  if (yaInicializada) {
    console.log(
      "La base ya estaba inicializada: se omite la carga de catálogo, categorías y revendedoras de ejemplo para no pisar los cambios hechos desde el admin."
    );
    return;
  }

  // Categorías del catálogo base, para que el admin pueda gestionarlas desde
  // /admin/categorias sin perder las que ya vienen cargadas.
  const categoriaNombres = [...new Set(catalogo.map((p) => p.category))];
  for (let i = 0; i < categoriaNombres.length; i++) {
    await prisma.category.upsert({
      where: { name: categoriaNombres[i] },
      update: {},
      create: { name: categoriaNombres[i], position: i },
    });
  }

  // Reemplazo total del catálogo: se quita todo lo que no esté en la lista nueva.
  // Si un producto viejo tiene pedidos asociados no se puede borrar (por la
  // integridad del historial), así que en ese caso se lo desactiva en vez de
  // eliminarlo, para que no siga apareciendo en el catálogo público.
  const validIds = new Set(catalogo.map((p) => p.id));
  const existentes = await prisma.product.findMany({ select: { id: true } });
  let eliminados = 0;
  let desactivados = 0;
  for (const { id } of existentes) {
    if (validIds.has(id)) continue;
    try {
      await prisma.product.delete({ where: { id } });
      eliminados++;
    } catch {
      await prisma.product.update({ where: { id }, data: { active: false } });
      desactivados++;
    }
  }

  for (const p of catalogo) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log(
    `Catálogo verificado: ${catalogo.length} productos. Productos anteriores: ${eliminados} eliminados, ${desactivados} desactivados (tenían pedidos asociados).`
  );

  const passwordHash = await hashPassword(DEMO_RESELLER_PASSWORD);
  for (const r of resellers) {
    await prisma.reseller.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, passwordHash },
    });
  }
  console.log(
    `Revendedoras de ejemplo verificadas: ${resellers.length} (contraseña de prueba: "${DEMO_RESELLER_PASSWORD}").`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
