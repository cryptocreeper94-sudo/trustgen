/* ====== Chronicles 3D Asset Pipeline — Complete Asset Registry ====== */

export type AssetEra = 'modern' | 'medieval' | 'wild-west'
export type AssetCategory = 'character' | 'pet' | 'environment' | 'storefront'
export type AssetStatus = 'pending' | 'generating' | 'generated' | 'rigged' | 'complete'

export interface ChroniclesAsset {
    id: string
    name: string
    era: AssetEra
    category: AssetCategory
    subcategory?: string
    description: string
    status: AssetStatus
    needsRigging: boolean
}

// ─── CHARACTERS (22) ───────────────────────────────────────────

const CHARACTERS: ChroniclesAsset[] = [
    {
        id: 'char-player-modern-m',
        name: 'Player Character — Modern (Male)',
        era: 'modern', category: 'character', subcategory: 'player',
        description: 'Full-body 3D character of a young adult man, late 20s, neutral A-pose. Charcoal henley shirt with sleeves pushed up, dark slim jeans, white sneakers. Modern short haircut with fade. Athletic build. Neutral confident expression, clean-shaven. Leather watch on left wrist. No background, flat invisible surface. Realistic proportions, game-ready low-poly, clean topology.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-player-modern-f',
        name: 'Player Character — Modern (Female)',
        era: 'modern', category: 'character', subcategory: 'player',
        description: 'Full-body 3D character of a young adult woman, late 20s, neutral A-pose. Sage green fitted jacket over white tank top, dark high-waisted pants, tan ankle boots. Shoulder-length wavy brown hair. Athletic build. Neutral confident expression. Small hoop earrings, bracelet on right wrist. No background, flat invisible surface. Realistic proportions, game-ready low-poly, clean topology.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-player-medieval',
        name: 'Player Character — Medieval Outfit',
        era: 'medieval', category: 'character', subcategory: 'player',
        description: 'Full-body 3D character, young adult, neutral A-pose, medieval peasant-adventurer clothing. Brown leather vest over cream linen tunic, dark brown trousers tucked into tall leather boots with buckles. Leather belt with small pouch, forearm bracers. Hooded cloak over one shoulder. No weapons, no background. Game-ready low-poly. Worn but well-maintained traveler look. Clean topology, realistic proportions.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-player-wildwest',
        name: 'Player Character — Wild West Outfit',
        era: 'wild-west', category: 'character', subcategory: 'player',
        description: 'Full-body 3D character, young adult, neutral A-pose, Wild West frontier clothing. Dusty tan duster coat over dark button-up shirt, faded denim pants, scuffed brown cowboy boots with spurs. Weathered leather cowboy hat. Empty leather gun belt holster. Bandana loosely around neck. No background. Game-ready low-poly. Working frontier settler look. Clean topology, realistic proportions.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-elena-voss',
        name: 'Dr. Elena Voss — Chief Innovation Officer',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character of a sharp woman, early 40s, confident power pose. Sleek charcoal tailored blazer with mandarin collar, black fitted trousers, black pointed heels. Platinum blonde hair in tight severe bun. Angular features, high cheekbones, piercing ice-blue eyes. Thin silver smart glasses, silver stud earrings. Pale skin. Cold intelligence, corporate power. No background. Game-ready low-poly, clean topology.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-kai-ghost',
        name: 'Kai "Ghost" Reeves — Lead Hacktivist',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, lean young man, mid-20s, relaxed slouch. Oversized dark hoodie hood down, messy dyed-blue streaked black hair over one eye. Faded black cargo pants, beat-up high-tops with neon cyan laces. Dark skin, sharp jaw, intense dark brown eyes with bags. Fingerless gloves, earbuds around neck. Cyberpunk-adjacent urban style. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-diana-reyes',
        name: 'Mayor Diana Reyes — City Mayor',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, confident Latina woman, late 30s, standing tall hands clasped. Rich navy blazer over cream silk blouse, navy pencil skirt, nude heels. Black hair professional shoulder-length blowout with highlights. Warm brown eyes, bright genuine smile. Gold stud earrings, simple gold pendant necklace. Medium brown skin. Approachable yet authoritative leader. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-ursula-modern',
        name: 'Ursula — Keeper of Sacred Texts (Modern)',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, wise woman, early 60s, serene knowing expression. Deep purple cardigan over white cotton dress to ankles, brown leather sandals. Long silver-gray hair loosely braided over one shoulder. Warm olive skin, gentle wrinkles, kind hazel eyes. Holds thick worn leather-bound book against chest. Reading glasses on beaded chain. Calm grandmotherly presence. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-maya-chen',
        name: 'Maya Chen — Barista',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, cheerful young Asian woman, early 20s. Forest green canvas apron over vintage band t-shirt, cuffed boyfriend jeans, white Converse sneakers. Short pixie-cut black hair with pink streak. Bright brown eyes, wide friendly smile, small nose ring. Paint-stained fingers, friendship bracelets. Artsy and welcoming. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-marcus-torres',
        name: 'Marcus Torres — Personal Trainer',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, muscular Latino man, early 30s, confident stance. Fitted black compression athletic shirt, dark gray athletic shorts, training shoes. Short buzzed dark hair with sharp lineup. Strong jaw, warm brown eyes, motivating grin. Light stubble, silver chain necklace, fitness tracker. Visible geometric sleeve tattoo left arm. Broad shoulders. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-sarah-mitchell',
        name: 'Dr. Sarah Mitchell — Librarian',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, thoughtful woman, mid-40s, intellectual gentle demeanor. Rust-colored turtleneck sweater, long charcoal wool skirt, brown ankle boots. Auburn hair in loose bun with pencil stuck in it. Green eyes behind round tortoiseshell glasses. Fair skin, light freckles. Carries small stack of books under one arm. Pearl stud earrings. Warm patient expression. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-jake-williams',
        name: 'Jake Williams — Park Ranger',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, rugged outdoorsy man, late 30s, relaxed friendly stance. Olive green ranger uniform shirt rolled sleeves, khaki utility pants with leather belt, worn brown hiking boots. Sandy brown hair under tan ranger hat. Blue eyes, sun-weathered tan, friendly crow\'s feet. Short beard, walkie-talkie on belt. Lean athletic build. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-linda-park',
        name: 'Linda Park — Restaurant Owner',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, warm Korean-American woman, mid-50s, welcoming maternal smile. White chef\'s coat unbuttoned over red blouse, black pants, black kitchen clogs. Black hair with silver streaks in low ponytail. Warm dark brown eyes with smile lines. Small gold hoop earrings. Flour on sleeve. Medium build, strong hands. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-alex-rivera',
        name: 'Alex Rivera — Coworker',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, sharp young professional man, late 20s, casual business pose. Slim-fit light blue button-down rolled sleeves, dark chinos, brown oxford shoes. Dark wavy hair side part. Light brown skin, clean-shaven, brown eyes with witty spark. Smartwatch, messenger bag strap over shoulder. Lean build. Ambitious but approachable. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-emma-watson',
        name: 'Emma Watson — Shop Assistant',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, trendy young Black woman, early 20s, fashion-forward. Cropped denim jacket over bright coral bodycon dress, white platform sneakers. Long dark braids with gold cuffs swept to one side. Dark brown skin, high cheekbones, bold expressive eyes, glossy lips. Gold nameplate necklace, multiple small gold ear hoops. Confident hip-cocked pose. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-sam-peterson',
        name: 'Sam Peterson — Neighbor',
        era: 'modern', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, friendly retired man, mid-60s, warm easygoing posture. Blue-green plaid flannel shirt, comfortable khaki pants, brown leather loafers. Thinning gray hair, round friendly face, reading glasses on nose. Blue eyes, bushy gray eyebrows, gentle smile. Slight dad-bod. Holds coffee mug in one hand. Friendly neighbor everyone waves to. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-lord-aldric',
        name: 'Lord Aldric — High Chancellor',
        era: 'medieval', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, imposing nobleman, late 50s, regal authority. Dark red velvet doublet with gold embroidery over chainmail at collar and sleeves. Black leather boots to knee. Heavy fur-trimmed black cloak over left shoulder, fastened with gold crown brooch. Gray swept-back hair, trimmed silver beard. Steel-gray calculating eyes, aquiline nose. Holds rolled parchment. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-sera-nightwhisper',
        name: 'Sera Nightwhisper — The Silent Blade',
        era: 'medieval', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, mysterious lithe woman, early 30s, predatory stillness pose. Form-fitting dark leather armor with subtle purple accents, soft-soled black boots, hooded dark gray cloak pushed back. Raven-black hair short asymmetrical. Pale skin, sharp violet-gray eyes. Thin scar across left eyebrow. Two small daggers at hips. Fingerless leather gloves. Dangerous and beautiful. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-marcus-goldhand',
        name: 'Marcus Goldhand — Guildmaster',
        era: 'medieval', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, jovial wealthy merchant, mid-40s, arms slightly open welcoming. Rich burgundy merchant\'s robe with gold trim, wide brown leather belt with ornate gold buckle, polished brown boots. Thick curly chestnut hair, well-groomed goatee. Ruddy cheeks, bright green eyes, shrewd warm smile. Multiple gold rings, heavy coin purse on belt. Stocky well-fed build. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-ursula-medieval',
        name: 'Sister Ursula — Keeper of Sacred Library',
        era: 'medieval', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, devout scholarly woman, early 60s, quiet strength. Simple dark brown monastic robe with cream underdress, rope belt. Wooden cross pendant on leather cord. Brown leather sandals. Silver-gray hair under linen wimple and veil. Same face as Modern Ursula — warm olive skin, kind hazel eyes, gentle wrinkles. Carries ancient illuminated manuscript. Serene expression. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-marshal-colton',
        name: 'Marshal Jake Colton — Federal Marshal',
        era: 'wild-west', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, weathered stoic lawman, late 40s, quiet authority. Long dusty brown leather duster over dark vest and white collarless shirt. Dark worn denim, scuffed black cowboy boots. Silver marshal star badge on vest. Wide-brimmed black flat-crown hat. Salt-and-pepper stubble, steel-blue eyes, sun-weathered skin, jagged scar right cheek. Lean hardened build. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-rattlesnake-rosa',
        name: 'Rattlesnake Rosa — Gang Leader',
        era: 'wild-west', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, fierce charismatic outlaw woman, early 30s, defiant pose hand on hip. Fitted black leather vest over deep red blouse rolled sleeves, dusty black riding pants, tall black boots with silver toe caps. Black flat-crowned hat with rattlesnake skin band. Long dark auburn braid. Olive skin, sharp dark eyes, dangerous smirk, beauty mark left cheek. Twin revolver holsters. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-chief-running-bear',
        name: 'Chief Running Bear — Elder',
        era: 'wild-west', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, dignified Native American elder, late 60s, standing tall with ceremonial presence. Traditional buckskin clothing with turquoise and white beadwork. Bone breastplate necklace. Long silver-streaked black hair in two braids with leather and feathers. Deep bronze skin, wise dark brown eyes, strong nose. Eagle feather in hair. Holds carved wooden walking staff. Noble powerful presence. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
    {
        id: 'char-ursula-wildwest',
        name: 'Mother Ursula — Circuit Preacher Widow',
        era: 'wild-west', category: 'character', subcategory: 'npc',
        description: 'Full-body 3D character, resilient frontier woman, early 60s, fierce compassion. Practical long dark blue pioneer dress with white lace collar, heavy brown wool shawl, dusty lace-up leather boots. Same face as Modern Ursula — warm olive skin, kind hazel eyes, gentle wrinkles. Silver-gray hair in tight bun under dark bonnet. Carries battered leather-bound Cepher Bible and small medicine bag. Sun-weathered. No background. Game-ready low-poly.',
        status: 'pending', needsRigging: true,
    },
]

// ─── PETS & COMPANIONS (24) ───────────────────────────────────────

const PETS: ChroniclesAsset[] = [
    // Modern (8)
    { id: 'pet-german-shepherd', name: 'German Shepherd Dog', era: 'modern', category: 'pet', description: '3D model of a large German Shepherd standing alert. Classic black and tan saddle coat, pointed erect ears, intelligent dark brown eyes. Strong athletic build, bushy tail held slightly up. Detailed fur texture. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-golden-retriever', name: 'Golden Retriever Dog', era: 'modern', category: 'pet', description: '3D model of a friendly Golden Retriever in happy standing pose, tongue slightly out. Rich golden cream coat, soft floppy ears, warm brown eyes, wagging tail. Medium-large athletic build. Gentle joyful expression. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-husky', name: 'Husky Dog', era: 'modern', category: 'pet', description: '3D model of Siberian Husky standing proud, head slightly raised. Striking black and white coat with signature face mask markings. Bright blue eyes, thick fluffy curled tail, pointed ears. Athletic medium build. Alert adventurous expression. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-maine-coon', name: 'Maine Coon Cat', era: 'modern', category: 'pet', description: '3D model of a large Maine Coon cat sitting upright regally. Long fluffy silver tabby coat with luxurious neck mane, tufted ears, bushy tail wrapped around paws. Large green eyes, intelligent expression. Prominent lynx-like ear tufts. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-siamese-cat', name: 'Siamese Cat', era: 'modern', category: 'pet', description: '3D model of an elegant Siamese cat standing in sleek pose. Cream short coat with dark chocolate point markings on face, ears, paws, tail. Striking vivid blue almond-shaped eyes. Slender athletic build, wedge-shaped head, large pointed ears. Graceful curious expression. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-african-grey', name: 'African Grey Parrot', era: 'modern', category: 'pet', description: '3D model of an African Grey Parrot perched on simple wooden stand. Silver-gray feathers with bright red tail. Large intelligent dark eyes with white facial patches. Strong curved black beak. Detailed wing feather texture. One foot gripping perch. Alert attentive expression. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-turtle', name: 'Red-Eared Slider Turtle', era: 'modern', category: 'pet', description: '3D model of Red-Eared Slider turtle on flat surface. Olive green shell with yellow markings, distinctive red stripe behind each eye. Yellow and green striped head and legs extended. Shell with natural ridge patterns. Small calm peaceful appearance. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-ferret', name: 'Sable Ferret', era: 'modern', category: 'pet', description: '3D model of a sable ferret standing upright on hind legs, curious pose. Dark brown mask face with cream body, darker legs and tail. Small rounded ears, bright dark eyes, pink nose. Long slender body. Playful inquisitive expression. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    // Medieval (8)
    { id: 'pet-wolfhound', name: 'Wolfhound Dog', era: 'medieval', category: 'pet', description: '3D model of massive Irish Wolfhound standing tall and noble. Rough wiry gray brindle coat, long legs, deep chest, long narrow head with kind dark eyes. Lean muscular build. Tallest dog breed. Loyal guardian expression. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-mastiff', name: 'Mastiff Dog', era: 'medieval', category: 'pet', description: '3D model of English Mastiff in solid guard stance. Massive fawn-colored body with dark black muzzle mask. Wrinkled brow, droopy jowls, small dark eyes, broad powerful chest. Short dense coat. Heavy muscular build with enormous paws. Calm but imposing. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-destrier', name: 'Destrier War Horse', era: 'medieval', category: 'pet', subcategory: 'mount', description: '3D model of powerful medieval war horse standing proud. Large black stallion with feathered hooves, braided mane, muscular thick neck. Simple leather saddle with stirrups, dark red decorative caparison with gold trim. Dark intelligent eyes. Battle-ready calm stance. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-palfrey', name: 'Palfrey Riding Horse', era: 'medieval', category: 'pet', subcategory: 'mount', description: '3D model of graceful medieval riding horse, calm standing pose. Chestnut brown coat with flowing lighter mane and tail. Slender elegant build. Simple brown leather saddle and bridle. Gentle dark eyes, relaxed ears. Comfortable travel horse. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-peregrine', name: 'Peregrine Falcon', era: 'medieval', category: 'pet', description: '3D model of Peregrine Falcon on leather falconer glove. Blue-gray back and wings, white chest with dark barring, dark moustache stripe. Sharp yellow-ringed eyes, curved beak. Leather jesses on legs. Wings slightly spread. Fierce hunting posture. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-gyrfalcon', name: 'Gyrfalcon', era: 'medieval', category: 'pet', description: '3D model of majestic white Gyrfalcon on decorated wooden perch. Pure white plumage with subtle gray wing speckling. Large powerful build, biggest falcon. Sharp dark eyes, strong yellow beak and talons. Leather jesses, small silver bell on leg. Royal hunting bird presence. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-mouser-cat', name: 'Mouser Cat', era: 'medieval', category: 'pet', description: '3D model of scrappy tabby cat in stalking crouch pose. Brown and black striped tabby coat, slightly scruffy working cat fur. Alert yellow-green eyes, ears perked forward. Lean wiry build, tiny mouse-catcher. Notched left ear from past scraps. Compact agile body. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-tower-raven', name: 'Tower Raven', era: 'medieval', category: 'pet', description: '3D model of large glossy black raven perched on stone battlement block. Iridescent black feathers with purple-blue sheen. Large thick curved beak, intelligent beady dark eyes. Ruffled throat hackles. One foot raised slightly. Mysterious intelligent castle bird. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    // Wild West (8)
    { id: 'pet-mustang', name: 'Mustang Horse', era: 'wild-west', category: 'pet', subcategory: 'mount', description: '3D model of wild-spirited Mustang horse standing alert, head raised. Paint pattern coat — dark brown and white patches. Thick untamed mane and tail. Strong compact build. Simple rope halter, no saddle. Fierce free-spirited dark eyes. Not groomed or fancy, frontier workhorse. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-quarter-horse', name: 'Quarter Horse', era: 'wild-west', category: 'pet', subcategory: 'mount', description: '3D model of American Quarter Horse, steady standing pose. Solid sorrel reddish-brown coat with lighter flaxen mane and tail. Powerful muscular hindquarters and chest. Western saddle with horn, leather bridle with silver conchos. Calm reliable expression. Rancher working horse. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-blue-heeler', name: 'Blue Heeler Dog', era: 'wild-west', category: 'pet', description: '3D model of Australian Cattle Dog (Blue Heeler), alert working pose. Blue-gray mottled coat with tan markings on legs and face. Compact muscular build, pricked ears, intelligent dark eyes, strong muzzle. Focused herding expression. Tough working ranch dog. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-coonhound', name: 'Coonhound Dog', era: 'wild-west', category: 'pet', description: '3D model of Treeing Walker Coonhound, nose slightly raised catching scent. Tri-color coat — white body with large black and tan patches. Long droopy ears, soulful dark brown eyes, deep chest. Athletic lean build. Classic Southern tracking hound. No background, flat invisible surface. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-pack-mule', name: 'Pack Mule', era: 'wild-west', category: 'pet', subcategory: 'mount', description: '3D model of sturdy pack mule standing patiently with loaded saddlebags. Dark brown-gray coat, large ears, short upright mane. Canvas saddlebags and wooden pack frame with ropes, loaded with bedroll, pickaxe handle, canteen. Patient resigned expression. Stocky durable build. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-redtail-hawk', name: 'Red-Tail Hawk', era: 'wild-west', category: 'pet', description: '3D model of Red-Tailed Hawk perched on weathered wooden fence post. Brown mottled back feathers, cream breast with brown belly band, rusty-red tail. Sharp yellow eyes, curved beak, powerful yellow talons gripping post. Wings folded, alert scanning posture. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
    { id: 'pet-king-snake', name: 'King Snake', era: 'wild-west', category: 'pet', description: '3D model of California King Snake coiled on flat rock surface. Striking black body with bright white cream-colored bands. Smooth glossy scales. Head raised slightly, tongue flicking. Small dark eyes. About 3 feet long stretched. Non-venomous, clean geometric banding pattern. No background. Game-ready low-poly.', status: 'pending', needsRigging: false },
    { id: 'pet-appaloosa', name: 'Appaloosa Horse', era: 'wild-west', category: 'pet', subcategory: 'mount', description: '3D model of distinctive Appaloosa horse, relaxed pose. White coat with dramatic black leopard-spotted pattern on hindquarters and rump. Dark mane and tail. Lean athletic build. Visible striped hooves. Western saddle blanket but no saddle, simple bridle. Intelligent calm expression. Prized rare frontier horse. No background. Game-ready low-poly.', status: 'pending', needsRigging: true },
]

export { CHARACTERS, PETS }
