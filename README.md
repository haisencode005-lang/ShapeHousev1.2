# ShapeHouse

Site estático pronto para hospedar (ex: GitHub Pages). Todos os arquivos
ficam soltos na raiz do repositório — sem subpastas — incluindo as imagens
de produto da loja.

## Identidade visual

Preto e laranja como cores principais (`--bg`, `--c-brand` em `style.css`).
Treino mantém um azul discreto e a Loja um dourado discreto como accents de
seção, mas nenhuma cor verde é usada em nenhuma parte do site.

## Imagens necessárias na raiz

- `barra-porta.png`
- `barra-parede.png`
- `superband.png`
- `paralela-media.png`
- `paralela-baixa-madeira.png`
- `hero.jpg` — foto grande do hero da Home (opcional; sem ela o site usa um gradiente como reserva visual)

## Loja

A loja (`loja.html`) mostra exclusivamente os 5 produtos reais cadastrados,
sem categorias, sem "em breve" e sem placeholders:

1. **Barra Fixa de Porta** — `https://s.shopee.com.br/4LIBhg06OT`
2. **Barra Fixa de Parede** — `https://s.shopee.com.br/6fg6U6VqbX`
3. **Elásticos Super Band** — `https://s.shopee.com.br/8V7kfZ0Vya`
4. **Paralelas** — `https://s.shopee.com.br/6fg6UIR8bV`
5. **Paralelas Baixas** — `https://s.shopee.com.br/50XsVNKykZ`

Cada card tem imagem, nome, descrição curta e botão "COMPRAR AGORA" que abre
o link de afiliado em nova aba. Um aviso discreto sobre links de afiliado
aparece abaixo dos produtos.

## Dieta

A página de dieta (`dieta.html`) traz uma seção "Sobre a dieta gerada" antes
do formulário, explicando que o resultado é uma estimativa/ponto de partida
e não substitui acompanhamento nutricional profissional. Um aviso reforça
isso perto do resultado gerado.

## Estrutura

```
ShapeHouse/
  index.html      → Home
  dieta.html      → Formulário + gerador de dieta (com avisos informativos)
  treino.html     → Treino Personalizado (PPL/Full Body) + Treino TAF
  loja.html       → Loja com os 5 produtos reais e links de afiliado
  style.css       → Design system (preto + laranja)
  script.js       → Funções compartilhadas (menu, scroll reveal, header)
  dieta.js        → Cálculo de TMB/GET/macros e geração de refeições realistas
  treino.js       → Geração do treino (padrões de movimento, tempo, validação)
  loja.js         → Não utilizado atualmente (loja não tem mais categorias/chips)
```
