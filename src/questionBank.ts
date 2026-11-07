export type GeneratedQuestion = {
  id: string;
  skill: string;
  title: string;
  prompt: string;
  answer: number;
  unit?: string;
  method: string;
  explain: string;
  level: string;
};

const scenarios = [
  { name: '某市规模以上工业企业', a: '营业收入', b: '利润总额' },
  { name: '某省重点监测企业', a: '主营业务收入', b: '研发投入' },
  { name: '某地区公共财政', a: '一般公共预算收入', b: '民生支出' },
  { name: '某市社会消费品零售', a: '零售总额', b: '限额以上零售额' },
];

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const integer = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const money = (n: number) => n.toLocaleString('zh-CN');
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `q-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function generateQuestion(filter = 'all'): GeneratedQuestion {
  const kind = filter === 'all' ? pick(['growth', 'fraction', 'cut', 'average', 'table', 'chart']) : filter;
  const scenario = pick(scenarios);


  if (kind === 'chart') {
    const base = integer(500, 1800);
    const rate = pick([5, 8, 10, 12, 15, 20, 25]);
    const current = base * (1 + rate / 100);
    const chartType = pick(['bar', 'line', 'mix']);
    const years = ['2022', '2023', '2024', '2025'];
    const values = [Math.round(base * 0.78), Math.round(base * 0.86), base, current];
    const max = Math.max(...values);
    const bars = values.map((v, i) => `${years[i]}  ${'▇'.repeat(Math.max(1, Math.round(v / max * 18)))}  ${money(v)}`).join('\n');
    const chartTitle = chartType === 'bar' ? '柱状图' : chartType === 'line' ? '折线图' : '混合图';
    const visual = chartType === 'line'
      ? `年份：${years.join('   ')}\n数值：${values.join('   ')}\n趋势：${values.map((v, i) => i ? (v >= values[i - 1] ? '↗' : '↘') : '—').join('   ')}`
      : chartType === 'mix'
        ? `年份       ${years.join('   ')}\n${scenario.a}  ${values.join('   ')}\n变化趋势   ${values.map((v, i) => i ? (v >= values[i - 1] ? '↗' : '↘') : '—').join('   ')}`
        : bars;
    return {
      id: makeId(), skill: 'growth', title: `资料分析${chartTitle}`,
      prompt: `${scenario.name}${scenario.a}变化情况（单位：亿元）\n${visual}\n\n根据图表，2025年${scenario.a}同比增长率为多少？（输入百分数数值，保留1位小数）`,
      answer: Number(rate.toFixed(1)), unit: '%',
      method: '先确认图表横轴年份和纵轴指标，读取2024、2025年对应数值，再计算（现期量−基期量）÷基期量。',
      explain: `2024年为${money(base)}亿元，2025年为${money(current)}亿元；增长量=${money(current - base)}亿元，增长率=${money(current - base)}÷${money(base)}=${rate}%。`,
      level: '进阶',
    };
  }

  if (kind === 'table') {
    const base = integer(600, 2400);
    const rate = pick([6, 8, 10, 12, 15, 18, 20]);
    const current = base * (1 + rate / 100);
    const otherBase = integer(300, 1500);
    const otherCurrent = Math.round(otherBase * (1 + pick([4, 9, 13, 17]) / 100));
    const answer = Number(rate.toFixed(1));
    return {
      id: makeId(), skill: 'growth', title: '资料分析表格题',
      prompt: `${scenario.name}主要指标统计（单位：亿元）
指标                 2024年       2025年
${scenario.a.padEnd(18, ' ')} ${money(base).padStart(8, ' ')} ${money(current).padStart(10, ' ')}
${scenario.b.padEnd(18, ' ')} ${money(otherBase).padStart(8, ' ')} ${money(otherCurrent).padStart(10, ' ')}

根据表格，2025年${scenario.a}同比增长率为多少？（输入百分数数值，保留1位小数）`,
      answer, unit: '%',
      method: '先从表格中定位同一指标的两年数据，再用（现期量−基期量）÷基期量计算增长率。',
      explain: `增长量=${money(current)}−${money(base)}=${money(current - base)}；增长率=${money(current - base)}÷${money(base)}=${answer}%。`,
      level: '进阶',
    };
  }

  if (kind === 'growth') {
    const base = integer(240, 1800);
    const rate = pick([5, 8, 10, 12, 15, 20, 25]);
    const current = base * (1 + rate / 100);
    return {
      id: makeId(), skill: 'growth', title: '增长率与现期量',
      prompt: `${scenario.name}去年${scenario.a}为${money(base)}亿元，今年同比增长${rate}%。今年${scenario.a}为多少亿元？`,
      answer: current,
      method: `现期量=基期量×(1+增长率)。先算 ${money(base)}×(1+${rate}%)。`,
      explain: `${money(base)}×${(1 + rate / 100).toFixed(2)}=${money(current)}亿元。注意增长率要先加1再相乘。`,
      level: '基础',
    };
  }

  if (kind === 'fraction') {
    const base = integer(8, 80) * 40;
    const rate = pick([12.5, 16.6666666667, 20, 25, 33.3333333333, 40, 50]);
    const increase = base * rate / 100;
    const answer = Number(rate.toFixed(1));
    return {
      id: makeId(), skill: 'fraction', title: '特征分数与增长率',
      prompt: `${scenario.name}去年${scenario.b}为${money(base)}亿元，今年比去年增加${money(increase)}亿元。增长率约为多少？（输入百分数数值，保留1位小数）`,
      answer, unit: '%',
      method: `增长率=增长量÷基期量=${money(increase)}÷${money(base)}。观察分数特征，转化为熟悉百分数。`,
      explain: `${money(increase)}÷${money(base)}=${(rate / 100).toFixed(6)}，约为${answer}%。`,
      level: '基础',
    };
  }

  if (kind === 'cut') {
    const denominator = integer(32, 96) * 100;
    const numerator = integer(12, 88) * 100;
    const raw = numerator / denominator;
    const answer = Number(raw.toFixed(3));
    return {
      id: makeId(), skill: 'cut', title: '截位直除',
      prompt: `某项指标为${money(numerator)}，另一项指标为${money(denominator)}，求前者是后者的多少倍？（保留三位小数）`,
      answer,
      method: '先判断数量级，再将分子分母同步截位，优先保留前三位有效数字。',
      explain: `${money(numerator)}÷${money(denominator)}=${raw.toFixed(6)}，保留三位小数为${answer.toFixed(3)}。`,
      level: '进阶',
    };
  }

  if (kind === 'average') {
    const count = integer(4, 12);
    const average = integer(35, 260);
    const total = count * average;
    return {
      id: makeId(), skill: 'growth', title: '平均数计算',
      prompt: `${scenario.name}一季度${scenario.a}总量为${money(total)}万元，平均每月为多少万元？`,
      answer: average,
      method: '平均数=总量÷份数。观察是否可以约分或拆分。',
      explain: `${money(total)}÷${count}=${average}万元。`,
      level: '基础',
    };
  }

  return generateQuestion('all');
}
