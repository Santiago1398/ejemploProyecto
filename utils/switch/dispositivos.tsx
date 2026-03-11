export function deviceName(mac: string) {

    const tresPrimerosNumeros = mac.toString().substring(0, 3);

    switch (tresPrimerosNumeros) {
        case "106": return "V4";
        case "107": return "ALPHA";
        case "108": return "V2";
        case "109": return "SIGMA";
        case "114": return "CTI80";
        case "115": return "CTI40";
        case "117": return "CTI70";
        case "119": return "CTI41";
        case "110": return "SW1";
        case "121": return "SWD1";
        case "111": return "SW2";
        case "122": return "SWD2";
        case "123": return "SWD3";
        case "135": return "VX3";
        case "156": return "VXSTAGE";
        case "136": case "175": return "TC4";
        case "138": return "VX2";
        case "139": return "VX1";
        case "140": return "OMEGA";
        case "145": return "DLG";
        case "146": case "173": return "VDIp";
        case "162": return "TITANIO PRO";
        case "165": return "CTI75";
        case "150": case "174": return "VDIk";
        case "154": case "171": return "SILOWS3";
        case "157": case "172": return "SILOWS1";
        case "126": return "V4 plus";
        case "127": return "SIGMA2";
        case "128": return "ALPHA2";
        case "129": return "V2 Plus";
        case "130": return "CTI80_plus";
        case "131": return "CTI40_plus";
        case "132": return "CTI70_plus";
        case "133": return "CTI41_plus";
        case "142": return "TOLVA";
        case "148": case "167": return "CT2";
        case "143": case "166": return "CTX";
        case "163": return "TCA";
        case "168": return "SILOW_LEVEL";
        case "202": return "CTI40plus";
        case "207": return "CTI41plus";
        case "208": return "CTI80plus";
        case "205": return "VS2plus";
        case "206": return "TC5";
        case "209": return "GH20";
        case "177": return "GH25";
        case "210": return "CTI-AT";
        default: return "El dispositivo no esta definido en el SWITCH";
    }
}

export function deviceTraduccionAlarmas(mac: string, t: any, codigo: number) {

    const Tipodispositivo = mac.toString().substring(0, 3);

    switch (Tipodispositivo) {
        case "106": // v4
        case "107": // alpha 
        case "108": // v2
        case "109": // sigma
        case "114": // cti80
        case "115": // cti40
        case "117": // cti70
        case "119": // cti41
            return t(`controlador.alarma.${codigo}`)
        case "110": // sw1
        case "111": // sw2
        case "121": // swd1
        case "122": // swd2
        case "123": // swd3
            return t(`silo.alarma.${codigo}`)
        case "134": // pw
            return t(`pw.alarma.${codigo}`)
        case "136":
        case "175": // tc4
            return t(`tc4.texto.${codigo}`)
        case "126":
            return t(`v4plus.texto.${codigo}`)
        case "127":
            return t(`sigma2.texto.${codigo}`)
        case "129":
            return t(`v2plus.texto.${codigo}`)
        case "140":
            return t(`omega.texto.${codigo}`)
        case "128": // alpha2
        case "130": // cti80_plus
        case "131": // cti40_plus
        case "132": // cti70_plus
        case "141": // cti41_plus
        case "162": // titanio pro

        case "135": //vx3
        case "139": //vx1
        case "156": //vxstage
            return t(`alpha2.texto.${codigo}`)
        case "145": // dlg
        case "146": // vdip
        case "150": // VDI-k Bascula de pavos
        case "173": // VDI-p CON MICRO K61
        case "174": // VDI-k CON MICRO K61    
        case "154": //SILOWS3 (VDI-SILO)
        case "157": //SILOWS1 (VDI-SILO) 
        case "171": //SILOWS3_V2 (VDI  CON MICRO K61)
        case "172": //SILOWS_V2 (VDI CON MICRO K61)    
            return t(`vdi.texto.${codigo}`);
        default: return t(`alpha2.texto.${codigo}`)

    }
}