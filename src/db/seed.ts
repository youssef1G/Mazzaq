import { TZDate } from "@date-fns/tz";
import { hashPassword } from "better-auth/crypto";
import { addDays, format } from "date-fns";
import { eq, sql } from "drizzle-orm";
import {
  defaultDeliverySettings,
  defaultStoreSettings,
} from "@/lib/settings-schema";
import type { Database } from "./index";
import {
  account,
  categories,
  deliverySlots,
  discounts,
  productImages,
  products,
  productVariants,
  settings,
  user,
} from "./schema";

type CategorySeed = {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
  sortOrder: number;
};

type VariantSeed = {
  sku: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isDefault?: boolean;
  sortOrder: number;
};

type ProductSeed = {
  slug: string;
  categorySlug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  descriptionEn: string;
  descriptionAr: string;
  ingredientsEn: string;
  ingredientsAr: string;
  servesEn: string;
  servesAr: string;
  basePrice: number;
  leadTimeHours: number;
  isFeatured: boolean;
  sortOrder: number;
  image: string;
  imageAltEn: string;
  imageAltAr: string;
  variants: VariantSeed[];
};

const categorySeeds: CategorySeed[] = [
  {
    slug: "cakes",
    nameEn: "Celebration cakes",
    nameAr: "كيك المناسبات",
    descriptionEn:
      "Layer cakes and entremets made for the centre of the table.",
    descriptionAr: "كيك طبقات وإنتريميه يصنع ليكون قلب الطاولة.",
    imageUrl: "/images/products/knafeh-cheesecake.jpg",
    sortOrder: 1,
  },
  {
    slug: "pastries",
    nameEn: "Morning pastries",
    nameAr: "معجنات الصباح",
    descriptionEn: "Laminated, slow-proofed and baked at dawn.",
    descriptionAr: "معجنات مورقة، تخمّر ببطء، وتُخبز عند الفجر.",
    imageUrl: "/images/products/pistachio-croissant.jpg",
    sortOrder: 2,
  },
  {
    slug: "desserts",
    nameEn: "Desserts",
    nameAr: "حلوى",
    descriptionEn: "Small-format desserts with a long memory.",
    descriptionAr: "حلويات صغيرة تترك حكاية طويلة.",
    imageUrl: "/images/products/rose-lychee-entremet.jpg",
    sortOrder: 3,
  },
  {
    slug: "cookies",
    nameEn: "Cookies & bites",
    nameAr: "كوكيز وقطع صغيرة",
    descriptionEn: "Crisp edges, soft centres, an Egyptian pantry.",
    descriptionAr: "حواف مقرمشة، قلب طري، ومخزن مصري.",
    imageUrl: "/images/products/halawa-cookie.jpg",
    sortOrder: 4,
  },
  {
    slug: "gift-boxes",
    nameEn: "Gift boxes",
    nameAr: "علب الهدايا",
    descriptionEn: "Curated boxes for occasions and thank-yous.",
    descriptionAr: "علب مختارة للمناسبات والشكر.",
    imageUrl: "/images/products/celebration-box.jpg",
    sortOrder: 5,
  },
];

const productSeeds: ProductSeed[] = [
  {
    slug: "pistachio-orange-blossom-croissant",
    categorySlug: "pastries",
    nameEn: "Pistachio & orange blossom croissant",
    nameAr: "كرواسون الفستق وماء الزهر",
    shortDescriptionEn:
      "72-layer lamination, pistachio cream, orange blossom glaze.",
    shortDescriptionAr: "٧٢ طبقة مورقة، كريمة فستق، وجليز ماء الزهر.",
    descriptionEn:
      "A three-day croissant: cultured butter laminated into 72 layers, proofed slowly overnight, then filled with Sicilian pistachio cream and finished with a whisper of orange blossom. Baked twice daily, never held over.",
    descriptionAr:
      "كرواسون على مدى ثلاثة أيام: زبدة مخمّرة تُطوى إلى ٧٢ طبقة، تُترك لتخمّر ببطء طوال الليل، ثم تُحشى بكريمة الفستق الصقلي وتُلمّس بماء الزهر. يُخبز مرتين يومياً ولا يُحفظ لليوم التالي.",
    ingredientsEn:
      "Wheat flour, cultured butter, milk, eggs, sugar, pistachio, orange blossom water, sea salt, yeast.",
    ingredientsAr:
      "دقيق قمح، زبدة مخمّرة، حليب، بيض، سكر، فستق، ماء زهر، ملح بحري، خميرة.",
    servesEn: "1 or a box to share",
    servesAr: "قطعة أو علبة للمشاركة",
    basePrice: 14000,
    leadTimeHours: 24,
    isFeatured: true,
    sortOrder: 1,
    image: "/images/products/pistachio-croissant.jpg",
    imageAltEn:
      "A pistachio croissant with crushed pistachios on a linen cloth",
    imageAltAr: "كرواسون بالفستق المطحون على قماش كتان",
    variants: [
      {
        sku: "MAZ-CRO-PIS-1",
        nameEn: "Single",
        nameAr: "قطعة واحدة",
        price: 14000,
        stock: 40,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-CRO-PIS-4",
        nameEn: "Box of four",
        nameAr: "علبة ٤ قطع",
        price: 52000,
        stock: 12,
        sortOrder: 2,
      },
      {
        sku: "MAZ-CRO-PIS-9",
        nameEn: "Box of nine",
        nameAr: "علبة ٩ قطع",
        price: 112000,
        stock: 6,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "knafeh-cheesecake",
    categorySlug: "cakes",
    nameEn: "Knafeh cheesecake",
    nameAr: "تشيز كيك الكنافة",
    shortDescriptionEn:
      "Crisp knafeh crust, salted cream cheese, blossom syrup.",
    shortDescriptionAr: "قشرة كنافة مقرمشة، جبن كريمي مملح، وشربات زهر.",
    descriptionEn:
      "Our most requested cake. A thin, crisp knafeh base under a slow-baked salted cheesecake, brushed with orange blossom syrup and finished with pistachio. Best served just cooler than room temperature.",
    descriptionAr:
      "أكثر كيكاتنا طلباً. قاعدة كنافة رقيقة ومقرمشة تحت تشيز كيك مملح مخبوز ببطء، مدهون بشربات ماء الزهر ومزيّن بالفستق. يُقدّم أفضل ما يكون أقل قليلاً من درجة حرارة الغرفة.",
    ingredientsEn:
      "Knafeh, cream cheese, mascarpone, sugar, eggs, butter, pistachio, orange blossom water, rose water.",
    ingredientsAr:
      "كنافة، جبن كريمي، ماسكاربوني، سكر، بيض، زبدة، فستق، ماء زهر، ماء ورد.",
    servesEn: "8–10 guests",
    servesAr: "٨–١٠ أشخاص",
    basePrice: 185000,
    leadTimeHours: 48,
    isFeatured: true,
    sortOrder: 2,
    image: "/images/products/knafeh-cheesecake.jpg",
    imageAltEn: "Golden knafeh cheesecake with pistachio on a ceramic plate",
    imageAltAr: "تشيز كيك كنافة ذهبي بالفستق على طبق خزفي",
    variants: [
      {
        sku: "MAZ-CHZ-KNA-8",
        nameEn: "8–10 guests",
        nameAr: "٨–١٠ أشخاص",
        price: 185000,
        stock: 6,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-CHZ-KNA-12",
        nameEn: "12–14 guests",
        nameAr: "١٢–١٤ شخصاً",
        price: 265000,
        stock: 4,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "date-tahini-layer-cake",
    categorySlug: "cakes",
    nameEn: "Date & tahini layer cake",
    nameAr: "كيك التمر والطحينة",
    shortDescriptionEn:
      "Medjool date sponge, tahini buttercream, toasted sesame.",
    shortDescriptionAr: "إسفنج تمر مجهول، كريمة طحينة بالزبدة، وسمسم محمّص.",
    descriptionEn:
      "Deep, nutty and not too sweet: a Medjool date sponge layered with tahini buttercream, a thin veil of dark chocolate, and toasted sesame. It is the cake we make for our own tables.",
    descriptionAr:
      "عميق، غني، وغير حلو أكثر من اللازم: إسفنج تمر مجهول بطبقات كريمة الطحينة والزبدة، غلاف رقيق من الشوكولاتة الداكنة، وسمسم محمّص. إنه الكيك الذي نصنعه لطاولاتنا.",
    ingredientsEn:
      "Wheat flour, Medjool dates, tahini, butter, sugar, eggs, dark chocolate, sesame, cream, sea salt.",
    ingredientsAr:
      "دقيق قمح، تمر مجهول، طحينة، زبدة، سكر، بيض، شوكولاتة داكنة، سمسم، كريمة، ملح بحري.",
    servesEn: "8–10 guests",
    servesAr: "٨–١٠ أشخاص",
    basePrice: 165000,
    leadTimeHours: 48,
    isFeatured: true,
    sortOrder: 3,
    image: "/images/products/date-tahini-cake.jpg",
    imageAltEn: "Date and tahini layer cake with sesame on a cake stand",
    imageAltAr: "كيك التمر والطحينة بالسمسم على حامل كيك",
    variants: [
      {
        sku: "MAZ-CAK-DAT-8",
        nameEn: "8–10 guests",
        nameAr: "٨–١٠ أشخاص",
        price: 165000,
        stock: 5,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-CAK-DAT-12",
        nameEn: "12–14 guests",
        nameAr: "١٢–١٤ شخصاً",
        price: 240000,
        stock: 3,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "rose-lychee-entremet",
    categorySlug: "desserts",
    nameEn: "Rose & lychee entremet",
    nameAr: "إنتريميه الورد والليتشي",
    shortDescriptionEn: "Lychee gel, rose mousse, almond crunch.",
    shortDescriptionAr: "هلام ليتشي، موس ورد، وقرمشة لوز.",
    descriptionEn:
      "A faceted entremet built around lychee gel and a delicate rose mousse, with an almond crunch and a thin white chocolate shell. Floral, cold and precise.",
    descriptionAr:
      "إنتريميه متعدد الأوجه بقلب من هلام الليتشي وموس ورد رقيق، مع قرمشة لوز وقشرة رقيقة من الشوكولاتة البيضاء. زهري، بارد، ودقيق.",
    ingredientsEn:
      "Lychee, cream, white chocolate, almonds, sugar, eggs, gelatin, rose water, butter.",
    ingredientsAr:
      "ليتشي، كريمة، شوكولاتة بيضاء، لوز، سكر، بيض، جيلاتين، ماء ورد، زبدة.",
    servesEn: "Per person",
    servesAr: "للشخص",
    basePrice: 32000,
    leadTimeHours: 48,
    isFeatured: true,
    sortOrder: 4,
    image: "/images/products/rose-lychee-entremet.jpg",
    imageAltEn:
      "Pale pink rose and lychee entremet with a white chocolate finish",
    imageAltAr: "إنتريميه ورد وليتشي وردي فاتح بلمسة شوكولاتة بيضاء",
    variants: [
      {
        sku: "MAZ-DES-ROS-1",
        nameEn: "Single",
        nameAr: "قطعة واحدة",
        price: 32000,
        stock: 24,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-DES-ROS-4",
        nameEn: "Box of four",
        nameAr: "علبة ٤ قطع",
        price: 118000,
        stock: 8,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "dark-chocolate-halawa-cookie",
    categorySlug: "cookies",
    nameEn: "Dark chocolate & halawa cookie",
    nameAr: "كوكيز الشوكولاتة الداكنة والحلاوة",
    shortDescriptionEn: "Brown butter, 70% chocolate, sesame halawa centre.",
    shortDescriptionAr: "زبدة بنية، شوكولاتة ٧٠٪، وقلب حلاوة طحينية بالسمسم.",
    descriptionEn:
      "A grown-up cookie: brown butter dough, pools of 70% dark chocolate and a soft centre of sesame halawa. Sea salt on top, always.",
    descriptionAr:
      "كوكيز للكبار: عجينة زبدة بنية، قطع شوكولاتة داكنة ٧٠٪، وقلب طري من الحلاوة الطحينية بالسمسم. مع رشة ملح بحري دائماً.",
    ingredientsEn:
      "Wheat flour, butter, sugar, eggs, dark chocolate, halawa, sesame, vanilla, sea salt.",
    ingredientsAr:
      "دقيق قمح، زبدة، سكر، بيض، شوكولاتة داكنة، حلاوة طحينية، سمسم، فانيليا، ملح بحري.",
    servesEn: "Per cookie",
    servesAr: "للقطعة",
    basePrice: 9500,
    leadTimeHours: 24,
    isFeatured: true,
    sortOrder: 5,
    image: "/images/products/halawa-cookie.jpg",
    imageAltEn: "Dark chocolate cookie with a soft halawa centre",
    imageAltAr: "كوكيز شوكولاتة داكنة بقلب حلاوة طري",
    variants: [
      {
        sku: "MAZ-COO-HAL-1",
        nameEn: "Single",
        nameAr: "قطعة واحدة",
        price: 9500,
        stock: 80,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-COO-HAL-6",
        nameEn: "Box of six",
        nameAr: "علبة ٦ قطع",
        price: 54000,
        stock: 20,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "cardamom-morning-buns",
    categorySlug: "pastries",
    nameEn: "Cardamom morning buns",
    nameAr: "بنس الصباح بالهيل",
    shortDescriptionEn: "Soft milk dough, green cardamom, muscovado glaze.",
    shortDescriptionAr: "عجينة حليب طرية، هيل أخضر، وجليز مسكوفادو.",
    descriptionEn:
      "Soft, pull-apart buns scented with green cardamom and finished with a muscovado glaze. Warm them for four minutes and the kitchen smells like a Cairo morning.",
    descriptionAr:
      "بنس طرية سهلة التقسيم برائحة الهيل الأخضر ومغطاة بجليز المسكوفادو. سخّنها أربع دقائق لتفوح رائحة صباح القاهرة في مطبخك.",
    ingredientsEn:
      "Wheat flour, milk, butter, sugar, eggs, cardamom, muscovado, yeast, sea salt.",
    ingredientsAr:
      "دقيق قمح، حليب، زبدة، سكر، بيض، هيل، مسكوفادو، خميرة، ملح بحري.",
    servesEn: "1 or a box to share",
    servesAr: "قطعة أو علبة للمشاركة",
    basePrice: 12000,
    leadTimeHours: 24,
    isFeatured: false,
    sortOrder: 6,
    image: "/images/products/cardamom-buns.jpg",
    imageAltEn: "Cardamom morning buns with a glossy glaze",
    imageAltAr: "بنس الصباح بالهيل بجليز لامع",
    variants: [
      {
        sku: "MAZ-PAS-CAR-1",
        nameEn: "Single",
        nameAr: "قطعة واحدة",
        price: 12000,
        stock: 36,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-PAS-CAR-4",
        nameEn: "Box of four",
        nameAr: "علبة ٤ قطع",
        price: 44000,
        stock: 12,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "basbousa-tres-leches",
    categorySlug: "desserts",
    nameEn: "Basbousa tres leches",
    nameAr: "بسبوسة تريس ليتشيس",
    shortDescriptionEn: "Semolina soak, three milks, pistachio and blossom.",
    shortDescriptionAr: "سميد مشرّب، ثلاث ألبان، فستق وزهر.",
    descriptionEn:
      "A meeting of two traditions: a fine semolina cake soaked in three milks, perfumed with orange blossom and topped with pistachio. Cold from the fridge, cut with a hot knife.",
    descriptionAr:
      "لقاء بين تقليدين: كيك سميد ناعم مشرّب بثلاثة أنواع من الحليب، معطر بماء الزهر ومغطى بالفستق. يُقدّم بارداً من الثلاجة ويُقطع بسكين ساخنة.",
    ingredientsEn:
      "Semolina, milk, condensed milk, cream, butter, sugar, eggs, pistachio, orange blossom water.",
    ingredientsAr:
      "سميد، حليب، حليب مكثف، كريمة، زبدة، سكر، بيض، فستق، ماء زهر.",
    servesEn: "8–10 guests",
    servesAr: "٨–١٠ أشخاص",
    basePrice: 125000,
    leadTimeHours: 48,
    isFeatured: false,
    sortOrder: 7,
    image: "/images/products/basbousa-tres-leches.jpg",
    imageAltEn: "Basbousa tres leches cake with pistachio",
    imageAltAr: "بسبوسة تريس ليتشيس بالفستق",
    variants: [
      {
        sku: "MAZ-DES-BAS-8",
        nameEn: "8–10 guests",
        nameAr: "٨–١٠ أشخاص",
        price: 125000,
        stock: 5,
        isDefault: true,
        sortOrder: 1,
      },
    ],
  },
  {
    slug: "pistachio-financiers",
    categorySlug: "cookies",
    nameEn: "Pistachio financiers",
    nameAr: "فيونسييه الفستق",
    shortDescriptionEn: "Brown butter almond cakes, pistachio, a little salt.",
    shortDescriptionAr: "كيك لوز بزبدة بنية، فستق، وقليل من الملح.",
    descriptionEn:
      "Small, dense almond cakes made with brown butter and pistachio, baked dark at the edges. The kind of thing that disappears before the tea is poured.",
    descriptionAr:
      "كيكات لوز صغيرة كثيفة بزبدة بنية وفستق، تُخبز حتى تغمق حوافها. من الحلويات التي تختفي قبل أن يُصب الشاي.",
    ingredientsEn:
      "Almond flour, pistachio, butter, egg whites, sugar, wheat flour, sea salt.",
    ingredientsAr: "دقيق لوز، فستق، زبدة، بياض بيض، سكر، دقيق قمح، ملح بحري.",
    servesEn: "Per piece",
    servesAr: "للقطعة",
    basePrice: 11000,
    leadTimeHours: 24,
    isFeatured: false,
    sortOrder: 8,
    image: "/images/products/pistachio-financiers.jpg",
    imageAltEn: "Pistachio financiers with golden edges",
    imageAltAr: "فيونسييه الفستق بحواف ذهبية",
    variants: [
      {
        sku: "MAZ-COO-FIN-1",
        nameEn: "Single",
        nameAr: "قطعة واحدة",
        price: 11000,
        stock: 50,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-COO-FIN-8",
        nameEn: "Box of eight",
        nameAr: "علبة ٨ قطع",
        price: 82000,
        stock: 15,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "mazzaq-celebration-box",
    categorySlug: "gift-boxes",
    nameEn: "The Mazzaق celebration box",
    nameAr: "علبة مزاق للاحتفال",
    shortDescriptionEn: "A curated box of cakes, cookies and a candle.",
    shortDescriptionAr: "علبة مختارة من الكيك والكوكيز وشمعة.",
    descriptionEn:
      "Our answer to every occasion: an assortment of entremets, financiers, halawa cookies and a hand-poured candle, packed in a reusable linen-wrapped box with a handwritten note.",
    descriptionAr:
      "إجابتنا لكل مناسبة: تشكيلة من الإنتريميه والفيونسييه وكوكيز الحلاوة وشمعة مصبوبة يدوياً، في علبة قابلة لإعادة الاستخدام مغلفة بالكتان مع رسالة مكتوبة بخط اليد.",
    ingredientsEn:
      "Assorted cakes and cookies; see individual items. Contains wheat, dairy, eggs, nuts, sesame and soy.",
    ingredientsAr:
      "تشكيلة كيك وكوكيز؛ راجع كل صنف. تحتوي على قمح، ألبان، بيض، مكسرات، سمسم، وصويا.",
    servesEn: "6–8 guests",
    servesAr: "٦–٨ أشخاص",
    basePrice: 295000,
    leadTimeHours: 72,
    isFeatured: true,
    sortOrder: 9,
    image: "/images/products/celebration-box.jpg",
    imageAltEn: "A linen-wrapped Mazzaق celebration box of pastries",
    imageAltAr: "علبة مزاق للاحتفال مغلفة بالكتان ومليئة بالحلويات",
    variants: [
      {
        sku: "MAZ-GIF-CEL-CLA",
        nameEn: "Classic",
        nameAr: "كلاسيك",
        price: 295000,
        stock: 10,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-GIF-CEL-GRA",
        nameEn: "Grand",
        nameAr: "جراند",
        price: 395000,
        stock: 6,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "hibiscus-berry-pavlova",
    categorySlug: "desserts",
    nameEn: "Hibiscus & berry pavlova",
    nameAr: "بافلوفا الكركديه والتوت",
    shortDescriptionEn: "Crisp meringue, hibiscus cream, fresh berries.",
    shortDescriptionAr: "مرينغ مقرمش، كريمة كركديه، وتوت طازج.",
    descriptionEn:
      "A crisp-shelled pavlova with a marshmallow centre, whipped hibiscus cream and berries macerated in their own juice. Assembled close to delivery so the crunch survives the journey.",
    descriptionAr:
      "بافلوفا بقشرة مقرمشة وقلب مارشميلو، كريمة كركديه مخفوقة وتوت منقوع في عصيره. تُجمّع قرب موعد التوصيل لتبقى القرمشة حتى تصل.",
    ingredientsEn:
      "Egg whites, sugar, cream, hibiscus, berries, vanilla, cornstarch, lemon.",
    ingredientsAr:
      "بياض بيض، سكر، كريمة، كركديه، توت، فانيليا، نشا ذرة، ليمون.",
    servesEn: "Per person",
    servesAr: "للشخص",
    basePrice: 38000,
    leadTimeHours: 48,
    isFeatured: false,
    sortOrder: 10,
    image: "/images/products/hibiscus-pavlova.jpg",
    imageAltEn: "Hibiscus pavlova with cream and fresh berries",
    imageAltAr: "بافلوفا الكركديه بالكريمة والتوت الطازج",
    variants: [
      {
        sku: "MAZ-DES-PAV-1",
        nameEn: "Single",
        nameAr: "قطعة واحدة",
        price: 38000,
        stock: 16,
        isDefault: true,
        sortOrder: 1,
      },
      {
        sku: "MAZ-DES-PAV-4",
        nameEn: "Box of four",
        nameAr: "علبة ٤ قطع",
        price: 140000,
        stock: 6,
        sortOrder: 2,
      },
    ],
  },
];

function cairoToday() {
  return new TZDate(new Date(), "Africa/Cairo");
}

async function seedAdmin(db: Database) {
  const email = process.env.ADMIN_EMAIL ?? "admin@mazzaq.co";
  const password = process.env.ADMIN_PASSWORD ?? "MazzaqAdmin!2026";
  const name = process.env.ADMIN_NAME ?? "Mazzaق Admin";

  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, existing.id));
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    role: "admin",
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });
}

export async function seedDatabase(db: Database) {
  await db.transaction(async (tx) => {
    await tx
      .insert(settings)
      .values([
        { key: "store", value: defaultStoreSettings },
        { key: "delivery", value: defaultDeliverySettings },
      ])
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: sql`excluded.value` },
      });

    for (const category of categorySeeds) {
      await tx
        .insert(categories)
        .values(category)
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            descriptionEn: category.descriptionEn,
            descriptionAr: category.descriptionAr,
            imageUrl: category.imageUrl,
            sortOrder: category.sortOrder,
            isActive: true,
          },
        });
    }

    const categoryRows = await tx.select().from(categories);
    const categoryBySlug = new Map(
      categoryRows.map((category) => [category.slug, category]),
    );

    for (const product of productSeeds) {
      const category = categoryBySlug.get(product.categorySlug);
      if (!category) {
        throw new Error(`Missing category ${product.categorySlug}`);
      }

      const [row] = await tx
        .insert(products)
        .values({
          slug: product.slug,
          categoryId: category.id,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          shortDescriptionEn: product.shortDescriptionEn,
          shortDescriptionAr: product.shortDescriptionAr,
          descriptionEn: product.descriptionEn,
          descriptionAr: product.descriptionAr,
          ingredientsEn: product.ingredientsEn,
          ingredientsAr: product.ingredientsAr,
          servesEn: product.servesEn,
          servesAr: product.servesAr,
          basePrice: product.basePrice,
          leadTimeHours: product.leadTimeHours,
          isActive: true,
          isFeatured: product.isFeatured,
          sortOrder: product.sortOrder,
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            categoryId: category.id,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            shortDescriptionEn: product.shortDescriptionEn,
            shortDescriptionAr: product.shortDescriptionAr,
            descriptionEn: product.descriptionEn,
            descriptionAr: product.descriptionAr,
            ingredientsEn: product.ingredientsEn,
            ingredientsAr: product.ingredientsAr,
            servesEn: product.servesEn,
            servesAr: product.servesAr,
            basePrice: product.basePrice,
            leadTimeHours: product.leadTimeHours,
            isActive: true,
            isFeatured: product.isFeatured,
            sortOrder: product.sortOrder,
          },
        })
        .returning({ id: products.id });

      if (!row) throw new Error(`Failed to seed product ${product.slug}`);

      await tx.delete(productImages).where(eq(productImages.productId, row.id));
      await tx.insert(productImages).values({
        productId: row.id,
        url: product.image,
        altEn: product.imageAltEn,
        altAr: product.imageAltAr,
        sortOrder: 0,
        isPrimary: true,
      });

      for (const variant of product.variants) {
        await tx
          .insert(productVariants)
          .values({
            productId: row.id,
            sku: variant.sku,
            nameEn: variant.nameEn,
            nameAr: variant.nameAr,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice ?? null,
            stock: variant.stock,
            trackInventory: true,
            isDefault: variant.isDefault ?? false,
            isActive: true,
            sortOrder: variant.sortOrder,
          })
          .onConflictDoUpdate({
            target: productVariants.sku,
            set: {
              productId: row.id,
              nameEn: variant.nameEn,
              nameAr: variant.nameAr,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice ?? null,
              isDefault: variant.isDefault ?? false,
              isActive: true,
              sortOrder: variant.sortOrder,
            },
          });
      }
    }

    await tx
      .insert(discounts)
      .values({
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        minSubtotal: 50000,
        maxUses: 500,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: discounts.code,
        set: {
          type: "percentage",
          value: 10,
          minSubtotal: 50000,
          maxUses: 500,
          isActive: true,
        },
      });

    const today = cairoToday();
    const slotRows: (typeof deliverySlots.$inferInsert)[] = [];

    for (let offset = 0; offset < 45; offset += 1) {
      const date = format(addDays(today, offset), "yyyy-MM-dd");
      for (const window of defaultDeliverySettings.deliveryWindows) {
        slotRows.push({
          kind: "delivery",
          date,
          windowKey: window.key,
          labelEn: window.labelEn,
          labelAr: window.labelAr,
          startTime: window.start,
          endTime: window.end,
          capacity: defaultDeliverySettings.capacity,
        });
      }
    }

    await tx
      .insert(deliverySlots)
      .values(slotRows)
      .onConflictDoNothing({
        target: [
          deliverySlots.kind,
          deliverySlots.date,
          deliverySlots.windowKey,
        ],
      });

    await seedAdmin(tx as unknown as Database);
  });
}
