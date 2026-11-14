"use client";

type RoleId = "produsen" | "konsumen1" | "konsumen2" | "puncak" | "pengurai";

export function RoleIllustration({ role }: { role: RoleId }) {
  if (role === "produsen") {
    return (
      <svg viewBox="0 0 120 88" className="role-art" role="img" aria-label="Tumbuhan tumbuh dan berfotosintesis">
        <circle className="role-sun" cx="93" cy="18" r="10" fill="#FFC94A" />
        <path d="M59 78V35" stroke="#2F7A45" strokeWidth="6" strokeLinecap="round" />
        <g className="role-leaves" fill="#69B96F" stroke="#286A3E" strokeWidth="2">
          <path d="M58 51C42 50 35 40 37 29c13 0 22 7 21 22Z" />
          <path d="M61 43c15-1 23-10 21-21-13 0-21 7-21 21Z" />
          <path d="M58 66c-13 0-20-8-19-17 11 0 18 6 19 17Z" />
        </g>
        <path d="M31 79h58" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" />
        <path className="role-roots" d="M59 78 48 86m11-8 10 8m-10-8v9" stroke="#8B5E3C" strokeWidth="2" />
      </svg>
    );
  }

  if (role === "konsumen1") {
    return (
      <svg viewBox="0 0 120 88" className="role-art role-grasshopper" role="img" aria-label="Belalang melompat memakan daun">
        <path d="M18 68c18-4 27-14 35-29" stroke="#69B96F" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="69" cy="44" rx="24" ry="12" fill="#79C85A" stroke="#387A37" strokeWidth="3" />
        <circle cx="94" cy="39" r="10" fill="#9CDD65" stroke="#387A37" strokeWidth="3" />
        <circle cx="98" cy="36" r="2.5" fill="#263238" />
        <path className="role-legs" d="M60 51 43 72m31-19 16 20M57 38 40 26m39 12 16-16" stroke="#387A37" strokeWidth="4" strokeLinecap="round" />
        <path d="M103 43h10" stroke="#387A37" strokeWidth="2" />
      </svg>
    );
  }

  if (role === "konsumen2") {
    return (
      <svg viewBox="0 0 120 88" className="role-art role-frog" role="img" aria-label="Katak berkedip dan menangkap serangga">
        <ellipse cx="60" cy="57" rx="31" ry="21" fill="#66C66B" stroke="#257044" strokeWidth="3" />
        <circle cx="45" cy="35" r="13" fill="#78D57C" stroke="#257044" strokeWidth="3" />
        <circle cx="75" cy="35" r="13" fill="#78D57C" stroke="#257044" strokeWidth="3" />
        <g className="role-frog-eyes" fill="#182C28">
          <circle cx="46" cy="34" r="4" /><circle cx="74" cy="34" r="4" />
        </g>
        <path d="M48 58c8 7 16 7 24 0" fill="none" stroke="#257044" strokeWidth="3" strokeLinecap="round" />
        <path className="role-tongue" d="M61 60c18 3 28-4 38-15" fill="none" stroke="#E986A8" strokeWidth="4" strokeLinecap="round" />
        <circle cx="103" cy="42" r="4" fill="#7A5A05" />
      </svg>
    );
  }

  if (role === "puncak") {
    return (
      <svg viewBox="0 0 120 88" className="role-art role-eagle" role="img" aria-label="Elang mengepakkan sayap">
        <path className="role-wing-left" d="M58 45C42 14 19 15 7 24c13 3 19 13 22 28Z" fill="#9A6A43" stroke="#5E3E2C" strokeWidth="3" />
        <path className="role-wing-right" d="M62 45c16-31 39-30 51-21-13 3-19 13-22 28Z" fill="#9A6A43" stroke="#5E3E2C" strokeWidth="3" />
        <ellipse cx="60" cy="49" rx="17" ry="25" fill="#6D4933" />
        <circle cx="60" cy="29" r="13" fill="#F5F1DF" stroke="#5E3E2C" strokeWidth="2" />
        <path d="m70 31 15 5-14 6Z" fill="#E7A72E" />
        <circle cx="64" cy="27" r="2.5" fill="#17211F" />
        <path d="m52 72-8 10m24-10 8 10" stroke="#E7A72E" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 88" className="role-art role-decomposer" role="img" aria-label="Jamur tumbuh dan mengembalikan unsur hara ke tanah">
      <path d="M16 76h88" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" />
      <g className="role-mushroom">
        <path d="M58 42h13v34H58Z" fill="#F5E7CF" stroke="#9A5972" strokeWidth="2" />
        <path d="M39 43c2-24 48-24 51 0Z" fill="#E986A8" stroke="#9A315D" strokeWidth="3" />
        <circle cx="55" cy="33" r="4" fill="#FFF5F8" /><circle cx="73" cy="29" r="5" fill="#FFF5F8" />
      </g>
      <g className="role-spores" fill="#C85B84">
        <circle cx="29" cy="31" r="3" /><circle cx="99" cy="25" r="2.5" /><circle cx="91" cy="51" r="2" />
      </g>
      <path className="role-nutrients" d="M28 82h64" stroke="#FFC94A" strokeWidth="3" strokeDasharray="5 5" />
    </svg>
  );
}
