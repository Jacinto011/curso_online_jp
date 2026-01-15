export function formatarMoeda(valor, moeda = 'MZN') {
  if (moeda === 'MZN') {
    return `${valor.toFixed(2)} MT`;
  } else {
    // Converter de MZN para USD (taxa aproximada)
    const valorUSD = valor / 63.5; // 1 USD ≈ 63.5 MZN
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valorUSD);
  }
}

export function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas > 0) {
    return `${horas}h ${mins}min`;
  }
  return `${mins}min`;
}

export function formatarData(dataString) {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}