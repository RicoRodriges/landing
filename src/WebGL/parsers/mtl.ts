export type Material = {
    shininess?: number,
    ambient?: [number, number, number],
    diffuse?: [number, number, number],
    specular?: [number, number, number],
    emissive?: [number, number, number],
    opticalDensity?: number,
    opacity?: number,
    illum?: number,
};

export function parseMTL(text: string): Map<string, Material> {
    const result = new Map<string, Material>();

    let current: Material = {};
    const keywords: { [k: string]: (a1: string[], orig: string) => void } = {
        newmtl(_, name) {
            current = {};
            result.set(name, current);
        },
        Ns(parts) {
            current.shininess = parseFloat(parts[0]);
        },
        Ka(parts) {
            current.ambient = parts.map(parseFloat) as [number, number, number];
        },
        Kd(parts) {
            current.diffuse = parts.map(parseFloat) as [number, number, number];
        },
        Ks(parts) {
            current.specular = parts.map(parseFloat) as [number, number, number];
        },
        Ke(parts) {
            current.emissive = parts.map(parseFloat) as [number, number, number];
        },
        // map_Kd(parts, unparsedArgs)   { current.diffuseMap = parseMapArgs(unparsedArgs); },
        // map_Ns(parts, unparsedArgs)   { current.specularMap = parseMapArgs(unparsedArgs); },
        // map_Bump(parts, unparsedArgs) { current.normalMap = parseMapArgs(unparsedArgs); },
        Ni(parts) {
            current.opticalDensity = parseFloat(parts[0]);
        },
        d(parts) {
            current.opacity = parseFloat(parts[0]);
        },
        illum(parts) {
            current.illum = parseInt(parts[0]);
        },
    };

    const keywordRE = /(\w+)\s+(.*)/;
    for (const line of text.split('\n').map(v => v.trim())) {
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.debug('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return result;
}