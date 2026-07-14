const IMAGENS_POR_PRODUTO: Record<string, string> = {
  "Notebook Dell Inspiron 15": "/produtos/notebook.png",
  "Mouse sem fio Logitech M170": "/produtos/mouse.png",
  "Teclado Mecânico Redragon Kumara": "/produtos/teclado.png",
  "Monitor LG 24' Full HD": "/produtos/monitor.png",
  "Headset Gamer HyperX Cloud Stinger": "/produtos/headset.jpg",
  "Webcam Logitech C920": "/produtos/webcam.png",
  "SSD Kingston 480GB": "/produtos/ssd.png",
  "Cadeira Gamer ThunderX3": "/produtos/cadeira.jpg",
  "Carregador USB-C 65W": "/produtos/carregador.jpg",
  "Hub USB 4 Portas 3.0": "/produtos/hub.jpg",
};

const IMAGEM_FALLBACK = "/produtos/placeholder.svg";

export function getProdutoImagemUrl(descricaoProduto: string): string {
  return IMAGENS_POR_PRODUTO[descricaoProduto] ?? IMAGEM_FALLBACK;
}
