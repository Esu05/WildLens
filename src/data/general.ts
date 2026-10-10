import type { Category, Hazard, Species } from '../domain/types';

/**
 * Broad identification-only coverage: everyday plants and animals worldwide.
 * These have a name (and a scientific name where it is unambiguous) but no field notes;
 * the detailed entries in species.ts carry the notes. Add more by appending a line.
 *
 * Syntax: 'Common name|Scientific name', or just 'Common name'. Scientific names are
 * left out where a common name covers several species.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function make(
  list: string[],
  category: Category,
  prompt: (name: string) => string,
  hazards: Record<string, Hazard> = {},
): Species[] {
  return list.map((entry) => {
    const [commonName, scientificName = ''] = entry.split('|');
    return {
      id: slug(commonName),
      commonName,
      scientificName,
      category,
      prompt: prompt(commonName.toLowerCase()),
      hazard: hazards[commonName],
    };
  });
}

const MAMMALS = [
  'Domestic cat|Felis catus', 'Domestic dog|Canis lupus familiaris', 'Cow|Bos taurus', 'Water buffalo|Bubalus bubalis',
  'Goat|Capra hircus', 'Sheep|Ovis aries', 'Horse|Equus ferus caballus', 'Donkey|Equus asinus', 'Pig|Sus scrofa domesticus',
  'Camel', 'Asian elephant|Elephas maximus', 'Tiger|Panthera tigris', 'Lion|Panthera leo', 'Leopard|Panthera pardus',
  'Cheetah|Acinonyx jubatus', 'Wolf|Canis lupus', 'Red fox|Vulpes vulpes', 'Golden jackal|Canis aureus', 'Brown bear|Ursus arctos',
  'Sloth bear|Melursus ursinus', 'Giant panda|Ailuropoda melanoleuca', 'Gray squirrel', 'Rabbit', 'Wild boar|Sus scrofa',
  'Hedgehog', 'Bat', 'Otter', 'Bonnet macaque|Macaca radiata', 'Gorilla', 'Chimpanzee|Pan troglodytes', 'Giraffe', 'Zebra',
  'Rhinoceros', 'Hippopotamus|Hippopotamus amphibius', 'Kangaroo', 'Koala|Phascolarctos cinereus', 'Dolphin', 'Seal',
  'Nilgai|Boselaphus tragocamelus', 'Sambar deer|Rusa unicolor', 'Blackbuck|Antilope cervicapra', 'Red panda|Ailurus fulgens',
  'Raccoon|Procyon lotor', 'Mouse', 'Rat', 'Indian flying fox|Pteropus giganteus', 'Porcupine', 'Bison', 'Moose', 'Reindeer',
];
const MAMMAL_HAZARD: Record<string, Hazard> = {
  'Domestic dog': 'bite', Tiger: 'bite', Lion: 'bite', Leopard: 'bite', Cheetah: 'bite', Wolf: 'bite', 'Brown bear': 'bite',
  'Sloth bear': 'bite', 'Asian elephant': 'bite', 'Wild boar': 'bite', 'Bonnet macaque': 'bite', Hippopotamus: 'bite',
  Rhinoceros: 'bite', 'Water buffalo': 'bite', Bison: 'bite', Moose: 'bite', Raccoon: 'bite', Bat: 'bite', 'Indian flying fox': 'bite',
  Gorilla: 'bite', Chimpanzee: 'bite', 'Golden jackal': 'bite', Porcupine: 'sting',
};

const BIRDS = [
  'Rock pigeon|Columba livia', 'Spotted dove|Spilopelia chinensis', 'Domestic chicken|Gallus gallus domesticus', 'Mallard|Anas platyrhynchos',
  'Domestic goose', 'Mute swan|Cygnus olor', 'Jungle babbler|Argya striata', 'Common hoopoe|Upupa epops', 'Common kingfisher|Alcedo atthis',
  'Indian pond heron|Ardeola grayii', 'Great egret|Ardea alba', 'Grey heron|Ardea cinerea', 'Painted stork|Mycteria leucocephala',
  'Black-winged stilt|Himantopus himantopus', 'Little cormorant|Microcarbo niger', 'Barn owl|Tyto alba', 'Spotted owlet|Athene brama',
  'Great horned owl|Bubo virginianus', 'Bald eagle|Haliaeetus leucocephalus', 'Brahminy kite|Haliastur indus', 'Red-wattled lapwing|Vanellus indicus',
  'Purple sunbird|Cinnyris asiaticus', 'Common tailorbird|Orthotomus sutorius', 'Barn swallow|Hirundo rustica', 'Greater coucal|Centropus sinensis',
  'Blue jay|Cyanocitta cristata', 'American robin|Turdus migratorius', 'Northern cardinal|Cardinalis cardinalis', 'European robin|Erithacus rubecula',
  'Blue tit|Cyanistes caeruleus', 'Great tit|Parus major', 'Herring gull|Larus argentatus', 'Penguin', 'Greater flamingo|Phoenicopterus roseus',
  'Macaw', 'Hummingbird', 'Woodpecker', 'Coppersmith barbet|Psilopogon haemacephalus', 'Rufous treepie|Dendrocitta vagabunda',
  'Asian pied starling|Gracupica contra', 'Indian grey hornbill|Ocyceros birostris', 'Ostrich|Struthio camelus', 'Turkey', 'Crow-pheasant',
  'White-breasted waterhen|Amaurornis phoenicurus', 'Oriental darter|Anhinga melanogaster', 'Common sandpiper|Actitis hypoleucos', 'Hawk',
];
const BIRD_HAZARD: Record<string, Hazard> = { 'Domestic goose': 'bite', 'Mute swan': 'bite', Ostrich: 'bite' };

const REPTILES_AMPHIBIANS = [
  'Indian rock python|Python molurus', "Russell's viper|Daboia russelii", 'Common krait|Bungarus caeruleus', 'Indian rat snake|Ptyas mucosa',
  'Checkered keelback|Fowlea piscator', 'Green vine snake|Ahaetulla nasuta', 'King cobra|Ophiophagus hannah', 'Bengal monitor lizard|Varanus bengalensis',
  'Indian chameleon|Chamaeleo zeylanicus', 'Fan-throated lizard|Sitana ponticeriana', 'Indian star tortoise|Geochelone elegans',
  'Freshwater turtle', 'Mugger crocodile|Crocodylus palustris', 'Common Indian toad|Duttaphrynus melanostictus', 'Skittering frog|Euphlyctis cyanophlyctis',
  'Common Indian tree frog|Polypedates maculatus', 'Green sea turtle|Chelonia mydas', 'Iguana', 'Snake', 'Frog', 'Turtle', 'Tortoise', 'Lizard',
];
const REPTILE_HAZARD: Record<string, Hazard> = {
  "Russell's viper": 'venomous', 'Common krait': 'venomous', 'King cobra': 'venomous', 'Indian rock python': 'bite',
  'Mugger crocodile': 'bite', 'Bengal monitor lizard': 'bite', Snake: 'venomous', 'Checkered keelback': 'bite', 'Green vine snake': 'venomous',
};

const INSECTS = [
  'Monarch butterfly|Danaus plexippus', 'Common rose butterfly|Pachliopta aristolochiae', 'Lime butterfly|Papilio demoleus',
  'Common grass yellow|Eurema hecabe', 'Blue tiger butterfly|Tirumala limniace', 'Lemon emigrant|Catopsilia pomona', 'Peacock pansy|Junonia almana',
  'Painted lady|Vanessa cardui', 'Atlas moth|Attacus atlas', 'Hawk moth', 'Moth', 'Butterfly', 'Dragonfly', 'Damselfly', 'Grasshopper', 'Cricket',
  'Desert locust|Schistocerca gregaria', 'Stick insect', 'Cicada', 'Firefly', 'Ant', 'Termite', 'Paper wasp', 'Hornet', 'Bumblebee', 'Housefly|Musca domestica',
  'Mosquito', 'Rhinoceros beetle', 'Dung beetle', 'Stag beetle', 'Cockroach', 'Caterpillar', 'Aphid', 'Beetle', 'Fly', 'Bee',
];
const INSECT_HAZARD: Record<string, Hazard> = { 'Paper wasp': 'sting', Hornet: 'sting', Bumblebee: 'sting', Bee: 'sting', Ant: 'bite', Mosquito: 'bite', Caterpillar: 'sting' };

const OTHER_ANIMALS = [
  'Garden orb-weaver spider', 'Black widow spider|Latrodectus', 'Tarantula', 'Wolf spider', 'Spider', 'Indian red scorpion|Hottentotta tamulus', 'Scorpion',
  'Centipede', 'Millipede', 'Garden snail|Cornu aspersum', 'Earthworm', 'Crab', 'Starfish', 'Jellyfish', 'Fish', 'Octopus',
];
const OTHER_HAZARD: Record<string, Hazard> = {
  'Black widow spider': 'venomous', 'Indian red scorpion': 'venomous', Scorpion: 'venomous', Centipede: 'venomous', Tarantula: 'bite', Spider: 'bite',
  Jellyfish: 'sting', 'Wolf spider': 'bite',
};

/** Oxford Flowers-102 names plus other common garden and wild flowers. */
const FLOWERS = [
  'Pink primrose', 'Hard-leaved pocket orchid', 'Canterbury bells', 'Sweet pea|Lathyrus odoratus', 'English marigold|Calendula officinalis',
  'Tiger lily|Lilium lancifolium', 'Moon orchid', 'Bird of paradise|Strelitzia reginae', 'Monkshood|Aconitum', 'Globe thistle', 'Snapdragon|Antirrhinum majus',
  "Coltsfoot|Tussilago farfara", 'King protea|Protea cynaroides', 'Spear thistle|Cirsium vulgare', 'Yellow iris', 'Globeflower', 'Purple coneflower|Echinacea purpurea',
  'Peruvian lily|Alstroemeria', 'Balloon flower|Platycodon grandiflorus', 'Giant white arum lily', 'Fire lily', 'Pincushion flower', 'Fritillary',
  'Red ginger|Alpinia purpurata', 'Grape hyacinth|Muscari', 'Corn poppy|Papaver rhoeas', "Prince of Wales feathers", 'Stemless gentian', 'Artichoke',
  'Sweet William|Dianthus barbatus', 'Carnation|Dianthus caryophyllus', 'Garden phlox', 'Love-in-a-mist|Nigella damascena', 'Mexican aster|Cosmos bipinnatus',
  'Alpine sea holly', 'Cattleya orchid', 'Cape flower', 'Great masterwort', 'Siam tulip', 'Lenten rose|Helleborus orientalis', 'Barberton daisy|Gerbera jamesonii',
  'Daffodil|Narcissus', 'Sword lily|Gladiolus', 'Poinsettia|Euphorbia pulcherrima', 'Wallflower', 'Buttercup|Ranunculus', 'Oxeye daisy|Leucanthemum vulgare',
  'Common dandelion|Taraxacum officinale', 'Petunia|Petunia', 'Wild pansy|Viola tricolor', 'Primula', 'Pelargonium', 'Gaura', 'Geranium', 'Orange dahlia|Dahlia',
  'Cautleya spicata', 'Japanese anemone', 'Black-eyed Susan|Rudbeckia hirta', 'Californian poppy|Eschscholzia californica', 'Osteospermum', 'Spring crocus|Crocus',
  'Bearded iris|Iris germanica', 'Windflower', 'Tree poppy', 'Gazania', 'Azalea|Rhododendron', 'Water lily|Nymphaea', 'Rose|Rosa', 'Thorn apple|Datura stramonium',
  'Morning glory|Ipomoea', 'Passion flower|Passiflora', 'Toad lily', 'Anthurium|Anthurium', 'Frangipani|Plumeria', 'Clematis|Clematis', 'Columbine|Aquilegia',
  'Desert rose|Adenium obesum', 'Tree mallow', 'Magnolia|Magnolia', 'Cyclamen|Cyclamen', 'Canna lily|Canna', 'Hippeastrum', 'Bee balm', 'Foxglove|Digitalis purpurea',
  'Camellia|Camellia', 'Mallow', 'Mexican petunia', 'Bromeliad', 'Blanket flower|Gaillardia', 'Trumpet creeper|Campsis radicans', 'Blackberry lily',
  'Jasmine|Jasminum', 'Chrysanthemum|Chrysanthemum', 'Lavender|Lavandula', 'Orchid', 'Tulip|Tulipa', 'Daisy|Bellis perennis', 'Lily', 'Zinnia|Zinnia elegans',
  'Dahlia|Dahlia', 'Pansy', 'Violet', 'Poppy', 'Sweet alyssum', 'Hollyhock|Alcea rosea', 'Crown flower|Calotropis gigantea', 'Lantana|Lantana camara',
  'Four o\'clock flower', 'Periwinkle|Catharanthus roseus', 'Cosmos', 'Hydrangea|Hydrangea', 'Peony|Paeonia', 'Lilac', 'Gardenia', 'Impatiens',
];
const FLOWER_HAZARD: Record<string, Hazard> = {
  Monkshood: 'poisonous', Foxglove: 'poisonous', 'Thorn apple': 'poisonous', 'Crown flower': 'poisonous', Lantana: 'poisonous',
  'Giant white arum lily': 'poisonous', Anthurium: 'poisonous', Oleander: 'poisonous', Hydrangea: 'poisonous',
};

/** Trees, crops, houseplants and other plants. */
const OTHER_PLANTS = [
  'Oak tree', 'Pine tree', 'Coconut palm|Cocos nucifera', 'Palm tree', 'Banana plant|Musa', 'Bamboo', 'Teak tree|Tectona grandis', 'Eucalyptus tree',
  'Ashoka tree|Saraca asoca', 'Jackfruit tree|Artocarpus heterophyllus', 'Tamarind tree|Tamarindus indica', 'Papaya tree|Carica papaya', 'Guava tree|Psidium guajava',
  'Cactus', 'Aloe vera|Aloe vera', 'Money plant|Epipremnum aureum', 'Snake plant', 'Fern', 'Moss', 'Grass', 'Rice plant|Oryza sativa', 'Wheat|Triticum aestivum',
  'Maize|Zea mays', 'Sugarcane|Saccharum officinarum', 'Tomato plant', 'Chili plant|Capsicum', 'Mint|Mentha', 'Curry leaf tree|Murraya koenigii', 'Wild mushroom',
  'Ivy|Hedera helix', 'Maple tree|Acer', 'Birch tree|Betula', 'Willow tree|Salix', 'Cotton plant|Gossypium', 'Tea plant|Camellia sinensis', 'Castor oil plant|Ricinus communis',
  'Rubber plant|Ficus elastica', 'Fig tree|Ficus carica', 'Lemon tree|Citrus limon', 'Apple tree|Malus domestica', 'Pomegranate tree|Punica granatum',
  'Coriander plant|Coriandrum sativum', 'Basil|Ocimum basilicum', 'Spinach|Spinacia oleracea', 'Cabbage', 'Onion plant', 'Potato plant', 'Pumpkin plant',
  'Cucumber plant', 'Weed', 'Tree', 'Bush', 'Succulent', 'Pothos', 'Peace lily|Spathiphyllum', 'Monstera|Monstera deliciosa', 'Banyan leaf',
  'Mango tree|Mangifera indica', 'Cannabis plant', 'Poison ivy|Toxicodendron radicans', 'Stinging nettle|Urtica dioica', 'Lotus leaf',
];
const PLANT_HAZARD: Record<string, Hazard> = {
  'Wild mushroom': 'poisonous', 'Castor oil plant': 'poisonous', 'Poison ivy': 'poisonous', 'Stinging nettle': 'sting', 'Cactus': 'sting', 'Peace lily': 'poisonous',
};

export const GENERAL: Species[] = [
  ...make(MAMMALS, 'animal', (n) => `a photo of a ${n}, a mammal`, MAMMAL_HAZARD),
  ...make(BIRDS, 'bird', (n) => `a photo of a ${n}, a bird`, BIRD_HAZARD),
  ...make(REPTILES_AMPHIBIANS, 'animal', (n) => `a photo of a ${n}, a reptile or amphibian`, REPTILE_HAZARD),
  ...make(OTHER_ANIMALS, 'animal', (n) => `a photo of a ${n}`, OTHER_HAZARD),
  ...make(INSECTS, 'insect', (n) => `a photo of a ${n}, an insect`, INSECT_HAZARD),
  ...make(FLOWERS, 'plant', (n) => `a photo of a ${n}, a flower`, FLOWER_HAZARD),
  ...make(OTHER_PLANTS, 'plant', (n) => `a photo of a ${n}, a plant`, PLANT_HAZARD),
];
