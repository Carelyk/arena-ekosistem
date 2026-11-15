"use client";

type RoleId = "produsen" | "konsumen1" | "konsumen2" | "puncak" | "pengurai";

const outline = "#31513B";

export function RoleIllustration({ role }: { role: RoleId }) {
  if (role === "produsen") {
    return (
      <svg viewBox="0 0 160 108" className="role-art" role="img" aria-label="Tumbuhan bertumbuh dengan cahaya, air, dan tanah subur">
        <defs><linearGradient id="prod-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#DDF4FF"/><stop offset="1" stopColor="#F7F3C7"/></linearGradient></defs>
        <rect width="160" height="108" rx="18" fill="url(#prod-sky)"/>
        <g className="role-sun"><circle cx="132" cy="22" r="10" fill="#FFC94A"/><g stroke="#E5A915" strokeWidth="2" strokeLinecap="round"><path d="M132 6v5M132 33v5M116 22h5M143 22h5M121 11l4 4M139 29l4 4M143 11l-4 4"/></g></g>
        <path d="M0 81c28-8 53 2 80-4 30-7 53-3 80 5v26H0Z" fill="#93633F"/>
        <path d="M0 81c31-5 52 4 82-3 26-6 51-1 78 4" fill="none" stroke="#5FAF64" strokeWidth="7"/>
        <g className="role-leaves" stroke={outline} strokeWidth="2.5" strokeLinejoin="round"><path d="M79 83V39"/><path d="M78 58C59 58 51 47 54 34c15 0 25 8 24 24Z" fill="#68BF67"/><path d="M81 50c18-1 28-12 25-25-15 1-25 9-25 25Z" fill="#83D36D"/><path d="M78 72c-14 0-22-8-21-18 12 0 20 6 21 18Z" fill="#53A958"/></g>
        <g fill="#58A8E8" stroke="#2779B7" strokeWidth="1.5"><path d="M32 37c8 9 7 14 0 14s-8-5 0-14Z"/><path d="M42 50c6 7 5 11 0 11s-6-4 0-11Z"/></g>
        <g className="role-roots" fill="none" stroke="#F0C48C" strokeWidth="2" strokeLinecap="round"><path d="M79 82 66 101M79 83l13 18M79 84v19M72 92l-8 2M87 92l9 3"/></g>
      </svg>
    );
  }

  if (role === "konsumen1") {
    return (
      <svg viewBox="0 0 160 108" className="role-art" role="img" aria-label="Belalang melompat di atas daun hijau">
        <rect width="160" height="108" rx="18" fill="#FFF4C9"/>
        <circle cx="25" cy="20" r="11" fill="#FFE287" opacity=".75"/>
        <path d="M-5 100C27 67 63 70 91 108Z" fill="#6EC66C" stroke={outline} strokeWidth="2.5"/><path d="M4 99c27-10 48-14 74-12" fill="none" stroke="#3F8F4A" strokeWidth="2"/>
        <g className="role-grasshopper" stroke={outline} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="m68 56-30 30M76 64 55 98M91 63l25 28M97 55l31 17" fill="none" className="role-legs" strokeWidth="4"/>
          <ellipse cx="83" cy="50" rx="29" ry="15" fill="#77C857"/>
          <path d="M61 45c17-12 31-9 45 4-18 8-32 8-45-4Z" fill="#A6DB72"/>
          <circle cx="116" cy="43" r="13" fill="#98DD65"/><circle cx="121" cy="39" r="3.2" fill="#263238" stroke="none"/>
          <path d="M125 34c8-11 13-12 18-12M126 38c10-4 16-3 21 0" fill="none" strokeWidth="2"/>
          <path d="M44 76c-9-11-17-14-27-13" fill="none" stroke="#3F8F4A"/>
        </g>
        <g fill="#FFFFFF" opacity=".8"><circle cx="135" cy="82" r="4"/><circle cx="144" cy="88" r="2.5"/></g>
      </svg>
    );
  }

  if (role === "konsumen2") {
    return (
      <svg viewBox="0 0 160 108" className="role-art" role="img" aria-label="Katak di kolam sedang mengincar serangga">
        <defs><linearGradient id="frog-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#DDF4FF"/><stop offset="1" stopColor="#BFE9D2"/></linearGradient></defs>
        <rect width="160" height="108" rx="18" fill="url(#frog-sky)"/><path d="M0 78c35-9 54 3 80-2 31-6 51-5 80 3v29H0Z" fill="#69BFE0"/><ellipse cx="82" cy="88" rx="53" ry="12" fill="#62B65E" stroke={outline} strokeWidth="2.5"/>
        <g stroke={outline} strokeWidth="2.7" strokeLinejoin="round"><ellipse cx="82" cy="70" rx="32" ry="21" fill="#61C66B"/><circle cx="68" cy="51" r="14" fill="#7ADA79"/><circle cx="97" cy="51" r="14" fill="#7ADA79"/><g className="role-frog-eyes" fill="white"><circle cx="68" cy="50" r="7"/><circle cx="97" cy="50" r="7"/><circle cx="70" cy="50" r="2.8" fill="#263238"/><circle cx="95" cy="50" r="2.8" fill="#263238"/></g><path d="M68 72q14 13 28 0" fill="none"/><path d="M54 70 41 84M109 70l14 14" fill="none" strokeWidth="5" strokeLinecap="round"/></g>
        <path className="role-tongue" d="M94 70Q123 53 139 39" fill="none" stroke="#E5748E" strokeWidth="3" strokeLinecap="round"/><g fill="#7B572D"><circle cx="142" cy="36" r="3"/><path d="m142 36-6-5m6 5 6-5" stroke="#7B572D" strokeWidth="2"/></g>
        <g stroke="#438D49" strokeWidth="3"><path d="M19 77V49M28 78V58M138 77V51"/></g>
      </svg>
    );
  }

  if (role === "puncak") {
    return (
      <svg viewBox="0 0 160 108" className="role-art role-eagle" role="img" aria-label="Elang terbang tinggi di atas pegunungan">
        <defs><linearGradient id="eagle-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E8E0FF"/><stop offset="1" stopColor="#C7E9FA"/></linearGradient></defs>
        <rect width="160" height="108" rx="18" fill="url(#eagle-sky)"/><circle cx="131" cy="21" r="11" fill="#FFF0A5"/><path d="m0 101 37-37 26 22 27-35 36 37 15-17 19 30Z" fill="#789987"/><path d="m64 86 26-35 11 12-9-2-5 12-9-3Z" fill="#F7FBFF"/>
        <g stroke="#513A2B" strokeWidth="2.5" strokeLinejoin="round"><g className="role-wing-left"><path d="M79 53C61 31 35 25 16 37c19 3 24 12 29 22 12-7 22-6 34-6Z" fill="#865533"/><path d="M45 58 28 43M56 55 42 37"/></g><g className="role-wing-right"><path d="M81 53c18-22 44-28 63-16-19 3-24 12-29 22-12-7-22-6-34-6Z" fill="#865533"/><path d="m115 58 17-15M104 55l14-18"/></g><ellipse cx="80" cy="54" rx="13" ry="18" fill="#70472F"/><circle cx="83" cy="43" r="10" fill="#FAF7E8"/><circle cx="87" cy="41" r="2" fill="#263238" stroke="none"/><path d="m92 45 11 4-11 4Z" fill="#F3B52D"/></g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 108" className="role-art" role="img" aria-label="Jamur dan bakteri mengembalikan unsur hara ke tanah">
      <rect width="160" height="108" rx="18" fill="#FFF0F6"/><path d="M0 75c38-9 65 5 91-2 27-7 46-4 69 3v32H0Z" fill="#916344"/><path d="M0 76c37-7 64 6 91-1 28-7 48-2 69 2" fill="none" stroke="#B78B5D" strokeWidth="7"/>
      <g className="role-mushroom" stroke="#713B56" strokeWidth="2.5"><path d="M63 91c8-17 7-31 5-42h20c-3 14-1 29 7 42Z" fill="#FFF8EC"/><path d="M42 52c1-25 21-36 37-36 20 0 36 13 37 36Z" fill="#E96898"/><path d="M55 38c11-13 35-17 49 1" fill="none" stroke="#F9AFC8" strokeWidth="5" strokeLinecap="round"/><g fill="#FFF4F8" stroke="none"><circle cx="65" cy="29" r="5"/><circle cx="91" cy="36" r="4"/><circle cx="105" cy="26" r="3"/></g></g>
      <g className="role-spores" fill="#E77BA5"><circle cx="35" cy="28" r="3"/><circle cx="28" cy="47" r="2"/><circle cx="125" cy="34" r="3"/><circle cx="134" cy="51" r="2"/></g>
      <g fill="none" strokeLinecap="round"><path className="role-nutrients" d="M19 91h27M108 91h34" stroke="#FFC94A" strokeWidth="3" strokeDasharray="5 5"/><path d="m21 65 17 11-13 7" stroke="#B96D3D" strokeWidth="4"/><path d="m127 67-15 10 12 7" stroke="#6A9D48" strokeWidth="4"/></g>
      <g fill="#81C784" stroke="#397D45" strokeWidth="1.5"><circle cx="22" cy="24" r="4"/><circle cx="135" cy="22" r="5"/></g><g stroke="#397D45" strokeWidth="1.5"><path d="m18 20-4-4m12 4 4-4m101 2-4-5m12 6 5-3"/></g>
    </svg>
  );
}
