export type GeneratedQuestion = {
  id: string; skill: string; title: string; prompt: string; answer: number;
  unit?: string; method: string; explain: string; level: string; options?: number[];
};
const pick = <T,>(a:T[]):T => a[Math.floor(Math.random()*a.length)];
const int = (a:number,b:number) => Math.floor(Math.random()*(b-a+1))+a;
const id = () => globalThis.crypto?.randomUUID?.() ?? "q-"+Date.now()+"-"+Math.random();
const fmt = (n:number) => Math.round(n*100)/100;
const money = (n:number) => Math.round(n).toLocaleString("zh-CN");
const names = ["某市规模以上工业企业营业收入","某省社会消费品零售总额","某地区一般公共预算收入","某市高新技术企业研发投入","某省粮食总产量"];
function makeOptions(answer:number, unitScale=1):number[] {
  // 以正确值为中心构造可解释的常见误差：比例误判、基数偏差、单位/截位误差。
  const a=fmt(answer);
  const step=Math.max(Math.abs(answer)*0.06,Math.abs(unitScale)*0.5,0.01);
  const candidates=[a,fmt(answer*0.9),fmt(answer*1.1),fmt(answer-step),fmt(answer+step),fmt(answer*0.8),fmt(answer*1.2),fmt(answer+Math.max(unitScale,step*2)),fmt(answer-Math.max(unitScale,step*2))];
  const unique:number[]=[];
  for(const value of candidates){
    if(Number.isFinite(value)&&!unique.some(x=>Math.abs(x-value)<0.000001)) unique.push(value);
  }
  // 小数答案经两位小数展示；极小数或特殊单位下仍保证四个不同选项。
  let offset=1;
  while(unique.length<4&&offset<30){
    const candidate=fmt(answer+step*offset++);
    if(!unique.some(x=>Math.abs(x-candidate)<0.000001))unique.push(candidate);
  }
  if(!unique.some(x=>Math.abs(x-a)<0.000001))unique[0]=a;
  return [a,...unique.filter(x=>Math.abs(x-a)>=0.000001).slice(0,3)].sort(()=>Math.random()-.5);
}
export function generateQuestion(filter="all"):GeneratedQuestion {
 const types=["base","current","increase","rate","share","average","multiple","shareChange"];
 const kind=filter==="all"?pick(types):filter;
 const subject=pick(names), unit=pick(["亿元","万人","万吨","万件"]);
 if(kind==="base"){
  const base=int(800,5200), rate=pick([0.08,0.12,0.15,0.18,0.2,0.25]), current=Math.round(base*(1+rate));
  const answer=base;
  return {id:id(),skill:kind,title:"基期量 · 反求上年数据",prompt:subject+"本期为"+money(current)+unit+"，同比增长"+(rate*100)+"%。上年同期约为多少"+unit+"？",answer,unit:unit,options:makeOptions(answer,50),level:"基础",
   method:"题目给出现期量和增长率，求基期量。不要用现期量直接乘增长率；应当除以增长率对应的倍数。",
   explain:"①定位：本期="+money(current)+unit+"，增长率="+(rate*100)+"%。②关系：基期量=现期量÷(1+增长率)。③速算："+money(current)+"÷"+(1+rate)+"。可把除数化成整数比，例如÷1.2等于×5÷6。④结果约为"+money(answer)+unit+"。",
  };
 }
 if(kind==="current"){
  const base=int(700,4600), rate=pick([0.06,0.1,0.12,0.15,0.2,0.25]), answer=Math.round(base*(1+rate));
  return {id:id(),skill:kind,title:"现期量 · 基期推现期",prompt:subject+"上年为"+money(base)+unit+"，本年同比增长"+(rate*100)+"%。本年约为多少"+unit+"？",answer,unit,options:makeOptions(answer,50),level:"基础",
   method:"现期量=基期量×(1+增长率)。把增长率拆成原量和增量，先算基期量，再加增长量。",
   explain:"①增长量="+money(base)+"×"+(rate*100)+"%≈"+money(base*rate)+"。②现期量="+money(base)+"+"+money(base*rate)+"≈"+money(answer)+unit+"。③速算可拆分："+money(base)+"×"+(1+rate)+"。若增长率为15%，就算×(1+10%+5%)。",
  };
 }
 if(kind==="increase"){
  const base=int(900,6000), rate=pick([0.08,0.1,0.12,0.15,0.18,0.2]), answer=Math.round(base*rate);
  return {id:id(),skill:kind,title:"增长量 · 基期乘增长率",prompt:subject+"上年为"+money(base)+unit+"，本年同比增长"+(rate*100)+"%。本年比上年增加多少"+unit+"？",answer,unit,options:makeOptions(answer,20),level:"基础",
   method:"增长量=基期量×增长率。先把百分数转成易算分数，或拆成10%+5%等部分。",
   explain:"①问“增加多少”，不是问本期总量。②增长量="+money(base)+"×"+(rate*100)+"%。③拆算示例："+(rate===0.15?"×15%=×(10%+5%)":"将增长率化为熟悉分数或拆成整十百分数") +"。④结果="+money(answer)+unit+"。注意不能把现期量乘增长率。",
  };
 }
 if(kind==="rate"){
  const base=int(800,5200), rate=pick([0.08,0.1,0.125,0.15,0.2,0.25]), inc=Math.round(base*rate), answer=fmt(inc/base*100);
  return {id:id(),skill:kind,title:"增长率 · 特征分数与截位直除",prompt:subject+"上年为"+money(base)+unit+"，本年增加"+money(inc)+unit+"。同比增长率约为多少？（输入百分数）",answer,unit:"%",options:makeOptions(answer,1),level:"进阶",
   method:"增长率=增长量÷基期量。优先约分识别特征分数；不能整除时再用截位直除。",
   explain:"①分子是增长量"+money(inc)+"，分母是基期量"+money(base)+"。②列式："+money(inc)+"÷"+money(base)+"。③先观察能否约分为1/8、1/6、1/5、1/4、1/3等；若不能，分子分母同步截位保留前三位有效数字。④约为"+answer+"%。",
  };
 }
 if(kind==="share"){
  const total=int(1800,9000), share=pick([0.12,0.15,0.2,0.25,0.3,0.4]), part=Math.round(total*share), answer=fmt(part/total*100);
  return {id:id(),skill:kind,title:"比重 · 部分占整体",prompt:subject+"总量为"+money(total)+unit+"，其中某部分为"+money(part)+unit+"。该部分占总量的比重约为多少？（输入百分数）",answer,unit:"%",options:makeOptions(answer,1),level:"基础",
   method:"比重=部分量÷整体量。先把分子分母同时缩小，再识别常见分数或估算。",
    explain:"先定位部分量和整体量。比重=部分量÷整体量。先约分，再识别常见分数；不能约分时同步截位直除。答案约"+answer+"%。",
  };
 }
 if(kind==="average"){
  const count=int(6,18), avg=int(45,360), total=count*avg, answer=avg;
  return {id:id(),skill:kind,title:"平均数 · 总量除以份数",prompt:subject+"某季度总量为"+money(total)+"万元，共"+count+"个月。月均量为多少万元？",answer,unit:"万元",options:makeOptions(answer,5),level:"基础",
   method:"平均数=总量÷份数。优先约分；如果总量不整除，可用截位估算。比较平均数增长时，必须同时考虑总量和份数变化。",
   explain:"①明确总量="+money(total)+"万元，份数="+count+"。②平均数="+money(total)+"÷"+count+"。③可先约分或拆成整百、整十再除。④结果="+answer+"万元。易错：不要把总量增长率直接当成平均数增长率。",
  };
 }
 if(kind==="multiple"){
  const b=int(900,5000), k=pick([1.2,1.25,1.5,1.6,1.8,2]), a=Math.round(b*k), answer=fmt(a/b);
  return {id:id(),skill:kind,title:"倍数 · A是B的几倍",prompt:subject+"中，A为"+money(a)+unit+"，B为"+money(b)+unit+"。A是B的多少倍？（保留两位小数）",answer,unit:"倍",options:makeOptions(answer,0.1),level:"进阶",
   method:"倍数=A÷B。先判断数量级，再约分或截位直除。注意“A是B的几倍”不等于“A比B增长百分之几”。",
   explain:"①确定被比较量A="+money(a)+"，标准量B="+money(b)+"。②倍数="+money(a)+"÷"+money(b)+"。③同步截位："+money(a)+"÷"+money(b)+"≈"+answer+"。④结果约"+answer+"倍。若题目问“多几倍”，还需再减1。",
  };
 }
 // 两期比重变化：本期部分占比 - 基期部分占比
 const total0=int(3000,9000), partRate0=pick([0.18,0.22,0.25,0.3,0.35]), totalRate=pick([0.08,0.1,0.12,0.15]), partRate=totalRate+pick([-0.06,-0.03,0.03,0.05]), partRate1=Math.max(0.08,partRate0+partRate);
 const total1=Math.round(total0*(1+totalRate)), part0=Math.round(total0*partRate0), part1=Math.round(total1*partRate1);
 const answer=fmt((part1/total1-part0/total0)*100);
 const direction=answer>0?"上升":"下降";
 return {id:id(),skill:"shareChange",title:"两期比重变化 · 看部分增速与整体增速",prompt:subject+"上年总量"+money(total0)+unit+"，其中A部分占"+(part0/total0*100).toFixed(1)+"%；本年总量同比增长"+(totalRate*100).toFixed(0)+"%，A部分同比增长"+((part1/part0-1)*100).toFixed(1)+"%。本年A部分占比比上年变化多少个百分点？（可输入正负数）",answer,unit:"个百分点",options:makeOptions(answer,0.5),level:"进阶",
  method:"两期比重变化不必先算出两个比重。核心判断：部分增速a与整体增速b比较；a>b，比重上升；a<b，比重下降。变化量用两期比重相减。",
  explain:"①部分增速约"+((part1/part0-1)*100).toFixed(1)+"%，整体增速"+(totalRate*100).toFixed(0)+"%。②部分增速大于整体增速，因此比重上升。③精算：本期比重="+(part1/total1*100).toFixed(2)+"%，基期比重="+(part0/total0*100).toFixed(2)+"%。④变化="+answer+"个百分点。速算判断方向先比较两个增速，求幅度再用两期比重相减。",
 };
}
