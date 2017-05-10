// http://blogs.library.uvic.ca/index.php/DiscoveryLinking/about-discipline-facets-in-summon

var AGR_LIFESCIENCE = "Agriculture and Life Sciences";
var ARCH_URBSTUDIES = "Architecture and Urban Studies";
var BUSINESS = "Business";
var ENG = "Engineering";
var LAHS = "Liberal Arts & Human Sciences";
var NAT_RES_ENV = "Natural Resources and Environment";
var SCI = "Science";
var VETMED = "Veterinary Medicine";
var MED = "Medicine";

var SUMMON_CATEGORIES = [ 
    AGR_LIFESCIENCE, ARCH_URBSTUDIES, BUSINESS, ENG, LAHS, 
    NAT_RES_ENV, SCI, VETMED, MED
];

var discipline2Category = {
    "Agriculture" : AGR_LIFESCIENCE,
    "Anatomy & Physiology" : SCI,
    "Anthropology" : LAHS,
    "Applied Sciences" : SCI,
    "Architecture" : ARCH_URBSTUDIES,
    "Astronomy & Astrophysics" : SCI,
    "Biology" : SCI,
    "Botany" : SCI,
    "Business" : BUSINESS,
    "Chemistry" : SCI,
    "Computer Science" : ENG,
    "Dance" : LAHS,
    "Dentistry" : MED,
    "Diet & Clinical Nutrition" : AGR_LIFESCIENCE,
    "Drama" : LAHS,
    "Ecology" : NAT_RES_ENV,
    "Economics" : BUSINESS,
    "Education" : LAHS,
    "Engineering" : ENG,
    "Environmental Sciences" : NAT_RES_ENV,
    "Film" : LAHS,
    "Forestry" : NAT_RES_ENV,
    "Geography" : NAT_RES_ENV,
    "Geology" : SCI,
    "Government" : ARCH_URBSTUDIES,
    "History & Archaeology" : LAHS,
    "Human Anatomy & Physiology" : MED,
    "International Relations" : ARCH_URBSTUDIES,
    "Journalism & Communications" : LAHS,
    "Languages & Literatures" : LAHS,
    "Law" : LAHS,
    "Library & Information Science" : SCI,
    "Mathematics" : SCI,
    "Medicine" : MED,
    "Meteorology & Climatology" : NAT_RES_ENV,
    "Military & Naval Science" : LAHS,
    "Music" : LAHS,
    "Nursing" : MED,
    "Occupational Therapy & Rehabilitation" : MED,
    "Oceanography" : SCI,
    // "Parapsychology & Occult Sciences" : ,
    "Pharmacy, Therapeutics, & Pharmacology" : MED,
    "Philosophy" : LAHS,
    "Physical Therapy" : MED,
    "Physics" : SCI,
    "Political Science" : LAHS,
    "Psychology" : SCI,
    "Public Health" : LAHS,
    "Recreation & Sports" : LAHS,
    // "Religion" : ,
    "Sciences" : SCI,
    "Social Sciences" : LAHS,
    "Social Welfare & Social Work" : LAHS,
    "Sociology & Social History" : LAHS,
    "Statistics" : SCI,
    "Veterinary Medicine" : VETMED,
    "Visual Arts" : LAHS,
    "Women's Studies" : LAHS,
    "Zoology" : SCI,
};
