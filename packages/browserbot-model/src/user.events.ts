export interface DeviceInfo {
    userAgent: string,
    screen: {
        availHeight: number
        availWidth: number
        colorDepth: number
        height: number
        orientation: string
        pixelDepth: number
        width: number
    },
    dpi: number,
    timeZone: string,
    timeZoneOffset: number,
    language: string,
    platform: string,
    vendor: string,
    cpuCores: number,
    gpu: {
        performance: Performance;
        renderer: string;
        renderer2: string;
        vendor: string;
        vendor2: string;
    };
}

