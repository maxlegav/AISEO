declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: "jpeg" | "png" | "webp";
      quality?: number;
    };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: "pt" | "mm" | "cm" | "in";
      format?:
        | "a0"
        | "a1"
        | "a2"
        | "a3"
        | "a4"
        | "a5"
        | "a6"
        | "letter"
        | "legal"
        | [number, number];
      orientation?: "portrait" | "landscape";
      compress?: boolean;
      [key: string]: any;
    };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    save(): Promise<void>;
    toPdf(): any;
    toImg(): any;
    toCanvas(): Promise<HTMLCanvasElement>;
    toContainer(): any;
    toBlob(): Promise<Blob>;
    fromBlob(blob: Blob): Html2PdfInstance;
    output(type: string, options?: any): any;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(
    element: HTMLElement | string,
    options?: Html2PdfOptions
  ): Promise<void>;

  export = html2pdf;
}
