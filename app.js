const STORAGE_KEY = 'retirementHQ.v1';
const DAY = 86400000;
const sample = {
  careerStart: '2007-10-01', retirementDate: '2031-12-20', basePension: 93000,
  pensionDaily: 10, dropYears: 5, dropReturn: 5,
  balance457: 230000, balanceRoth: 88000, balanceTaxable: 7000, balanceCash: 0,
  homeValue: 650000, otherAssets: 0, mortgage: 250000, otherDebt: 0
};
const ids = Object.keys(sample);
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const preciseMoney = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const daysBetween = (a,b) => Math.max(0,Math.ceil((b-a)/DAY));
const load = () => ({...sample,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')});
const save = data => localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

function render(){
  const d=load(), now=new Date(), start=new Date(d.careerStart+'T00:00:00'), target=new Date(d.retirementDate+'T00:00:00');
  const remaining=daysBetween(now,target), total=Math.max(1,daysBetween(start,target)), served=Math.max(0,total-remaining);
  const yrs=Math.floor(remaining/365.2425), remAfterYrs=remaining-Math.floor(yrs*365.2425), mos=Math.floor(remAfterYrs/30.44), days=Math.max(0,Math.round(remAfterYrs-mos*30.44));
  document.getElementById('todayLabel').textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  document.getElementById('countdown').textContent=remaining===0?'Eligible now':`${yrs}y ${mos}m ${days}d`;
  document.getElementById('targetDateLabel').textContent=`Target: ${target.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
  const pct=Math.min(100,Math.max(0,served/total*100));
  document.getElementById('progressBar').style.width=pct+'%';
  document.getElementById('careerProgress').textContent=pct.toFixed(1)+'%';
  document.getElementById('pensionToday').textContent=money(d.basePension);
  document.getElementById('dailyAccrual').textContent='+'+preciseMoney(d.pensionDaily);
  document.getElementById('monthlyAccrual').textContent=`About ${money(d.pensionDaily*30.44)} per month`;
  const projected=Number(d.basePension)+remaining*Number(d.pensionDaily);
  document.getElementById('pensionAtTarget').textContent=money(projected);
  document.getElementById('targetIncrease').textContent=`${money(projected-d.basePension)} above today`;
  const serviceDays=Math.max(0,daysBetween(start,now));
  const serviceYears=serviceDays/365.2425;
  document.getElementById('serviceYears').textContent=serviceYears.toFixed(2);
  document.getElementById('serviceDetail').textContent=`${serviceDays.toLocaleString()} days of service`;

  const assets=Number(d.balance457)+Number(d.balanceRoth)+Number(d.balanceTaxable)+Number(d.balanceCash)+Number(d.homeValue)+Number(d.otherAssets);
  const debts=Number(d.mortgage)+Number(d.otherDebt), net=assets-debts;
  document.getElementById('netWorth').textContent=money(net);
  document.getElementById('lastUpdated').textContent='Saved on this device';
  const rows=[
    ['457',d.balance457,'Retirement account'],['Roth IRAs',d.balanceRoth,'Tax-free retirement'],['Taxable investments',d.balanceTaxable,'Brokerage'],['Cash',d.balanceCash,'Bank balances'],['Home equity',Number(d.homeValue)-Number(d.mortgage),'Home value minus mortgage'],['Other assets less debt',Number(d.otherAssets)-Number(d.otherDebt),'Other property and liabilities']
  ];
  document.getElementById('accountList').innerHTML=rows.map(([n,v,s])=>`<div class="account-row"><div><strong>${n}</strong><small>${s}</small></div><strong>${money(v)}</strong></div>`).join('');

  const oneYear=Number(d.pensionDaily)*365.2425;
  document.getElementById('oneYearPension').textContent='+'+money(oneYear)+'/yr';
  document.getElementById('fiveYearPension').textContent='+'+money(oneYear*5);
  const r=Number(d.dropReturn)/100, n=Number(d.dropYears), annual=projected;
  const drop=r===0?annual*n:annual*((Math.pow(1+r,n)-1)/r);
  document.getElementById('dropValue').textContent=money(drop);
}

function populate(){const d=load();ids.forEach(id=>document.getElementById(id).value=d[id]);}

document.getElementById('settingsBtn').addEventListener('click',()=>{populate();document.getElementById('settingsDialog').showModal();});
document.getElementById('settingsForm').addEventListener('submit',e=>{e.preventDefault();const data={};ids.forEach(id=>data[id]=document.getElementById(id).type==='date'?document.getElementById(id).value:Number(document.getElementById(id).value||0));save(data);document.getElementById('settingsDialog').close();render();});
document.getElementById('resetBtn').addEventListener('click',()=>{localStorage.removeItem(STORAGE_KEY);populate();render();});
render();
