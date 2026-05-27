import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Full OSU subject code list — discovered directly from the API (225 codes, all lowercase)
const SUBJECTS = [
  'accad','acctmis','acel','aedecon','aeroeng','afamast','agrcomm','agsysmt',
  'anatomy','animsci','anmltec','anthrop','arabic','arch','art','arteduc',
  'artssci','asamsts','ase','asl','astron','atmossc','aviatn','bcs',
  'biochem','bioethc','biology','biomede','biomsci','biophrm','biophys','biotech',
  'bmi','bsgp','busadm','busfin','busmhr','busml','busoba','bustec',
  'cbe','cbg','chem','chemphy','chinese','civicll','civilen','clas',
  'comldr','comm','compedu','compstd','consci','consysm','crplan','crpsoil',
  'cscffs','cse','csfrst','cshspmg','czech','dance','dent','denthyg',
  'design','dne','dsablst','eall','earthsc','ece','econ','educst',
  'edutl','eeob','ehe','english','engr','engredu','engrtec','engtech',
  'enr','entmlgy','enveng','envsct','esce','eseadm','esepsy','eshesa',
  'esltech','esphe','esqrem','esqual','essped','esspsy','eswde','ethnstd',
  'exp','fabeng','faes','fdscte','filmstd','french','frit','genbiol',
  'genchem','gened','genmath','genssc','genstds','geog','geoscim','german',
  'greek','hcinnov','hcs','hdfs','hebrew','hims','hindi','histart',
  'history','horttec','hthrhsc','humnntr','hw','intmed','intstds','ise',
  'islam','italian','japanse','jewshst','kinesio','knhes','know','knpe',
  'knsfhp','knsism','korean','larch','latin','law','ling','math',
  'matscen','mba','mcdbio','mdn','mdrngrk','meatsci','mecheng','medcoll',
  'medlbs','medmcim','medren','micrbio','milsci','molgen','music','navalsc',
  'nelc','neurosc','nrsadvn','nrsprct','nuclren','nursing','occther','optom',
  'osbp','pathol','peds','persian','philos','phr','physics','physio',
  'physthr','plntpth','polish','politsc','portgse','psybhlh','psych','pubafrs',
  'pubhbio','pubhehs','pubhepi','pubhhbp','pubhhmp','pubhlth','quechua','radsci',
  'relstds','respthr','rurlsoc','russian','sasia','scandvn','slavic','sociol',
  'socwork','somali','spanish','sphhrng','stat','surgery','swahili','theatre',
  'tlcte','tled','tlielp','tlistem','tlted','turkish','ukrain','urdu',
  'uzbek','vetbios','vetclin','vetprev','vissci','vmcoll','weldeng','wgsst',
  'yiddish'
];

const BASE = 'https://content.osu.edu/v2/classes/search';
const PAGE_SIZE = 200;
const DELAY_MS = 120;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchSubject(subject) {
  const courses = new Map();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${BASE}?q=a&subject=${subject}&p=${page}&pageSize=${PAGE_SIZE}`;
    try {
      const res = await fetch(url);
      if (!res.ok) { page++; continue; }
      const json = await res.json();
      const data = json.data;
      if (!data || !data.courses) break;

      totalPages = data.totalPages || 1;

      for (const item of data.courses) {
        const c = item.course;
        if (!c || courses.has(c.courseId)) continue;

        // Extract primary instructor from first section
        let instructor = null;
        if (item.sections?.length) {
          const meetings = item.sections[0].meetings;
          if (meetings?.length && meetings[0].instructors?.length) {
            instructor = meetings[0].instructors[0].displayName;
          }
        }

        courses.set(c.courseId, {
          id: c.courseId,
          subject: c.subject,
          catalogNumber: c.catalogNumber,
          title: c.title,
          description: c.description || '',
          credits: c.maxUnits || c.minUnits || 0,
          group: c.academicGroup || 'Other',
          career: c.academicCareer || '',
          instructor,
          term: c.term || '',
        });
      }

      process.stdout.write(`\r  ${subject} page ${page}/${totalPages} (${courses.size} so far)    `);
      page++;
      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`\n  Error fetching ${subject} p${page}:`, e.message);
      page++;
    }
  }

  return [...courses.values()];
}

async function main() {
  console.log(`Fetching courses for ${SUBJECTS.length} subjects...\n`);

  const allCourses = new Map();
  let subjectsDone = 0;

  for (const subject of SUBJECTS) {
    process.stdout.write(`[${String(++subjectsDone).padStart(3)}/${SUBJECTS.length}] ${subject.padEnd(12)}`);
    const courses = await fetchSubject(subject);
    for (const c of courses) {
      if (!allCourses.has(c.id)) allCourses.set(c.id, c);
    }
    console.log(`→ ${courses.length} courses (total unique: ${allCourses.size})`);
  }

  const output = [...allCourses.values()];
  console.log(`\nTotal unique courses: ${output.length}`);

  const outDir = join(__dirname, '../public');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'courses.json');
  writeFileSync(outPath, JSON.stringify(output));
  console.log(`Written to ${outPath} (${(JSON.stringify(output).length / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
