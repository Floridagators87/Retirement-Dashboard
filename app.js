const STORAGE_KEY = 'retirementHQ.v3';
const OLD_STORAGE_KEYS = ['retirementHQ.v2'];
const DAY = 86400000;
const YEAR_DAYS = 365.2425;

const accountDefinitions = [
  ['account175','175 Account','Deferred compensation'],
  ['kristaRoth','Krista Roth','Roth IRA'],
  ['stevenRoth','Steven Roth','Roth IRA'],
  ['baptist403b','Baptist 403(b)','Employer retirement'],
  ['city457b','City of Miami 457(b)','Deferred compensation'],
  ['robinhoodRoth','Robinhood Roth','Roth IRA'],
  ['robinhoodTaxable','Robinhood Taxable','Brokerage account']
];

const defaults = {
  careerStart: '2007-10-29', retirementDate: '2031-09-23', pensionSalary: 168017,
  currentSalaryStart: '2025-10-29', priorSalary: 163992, priorSalaryStart: '2024-10-29',
  dropYears: 5, dropReturn: 5, homeValue: 700000, mortgage: 277902, otherAssets: 0, otherDebt: 0,
  account175: 170411, kristaRoth: 31000, stevenRoth: 48450, baptist403b: 10450,
  city457b: 255000, robinhoodRoth: 10200, robinhoodTaxable: 13500,
  balancesUpdatedAt: new Date().toISOString()
};

const settingIds = ['careerStart','retirementDate','pensionSalary','currentSalaryStart','priorSalary','priorSalaryStart','dropYears','dropReturn','homeValue','mortgage','otherAssets','otherDebt'];
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const preciseMoney = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const dateAtLocalMidnight = value => new Date(value + 'T00:00:00');
const serviceYearsAt = (start, at) => Math.max(0,(at-start)/DAY/YEAR_DAYS);
const multiplierAt = years => Math.min(years,15)*0.03 + Math.max(0,years-15)*0.035;
const pensionAt = (salary,years) => Number(salary)*multiplierAt(years);

function load(){
  let stored = localStorage.getItem(STORAGE_KEY);
  if(!stored){
    for(const key of OLD_STORAGE_KEYS){ if(localStorage.getItem(key)){ stored=localStorage.getItem(key); break; } }
  }
  const parsed = stored ? JSON.parse(stored) : {};
  return {...defaults,...parsed};
}
function save(data){ localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); }
function investmentTotal(d){ return accountDefinitions.reduce((sum,[id])=>sum+Number(d[id]||0),0); }
function formatUpdated(iso){
  if(!iso) return 'Not yet';
  const dt=new Date(iso), now=new Date(), sameDay=dt.toDateString()===now.toDateString();
  return sameDay ? dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function calendarCountdown(from,to){
  if(from>=to) return 'Eligible now';
  let years=to.getFullYear()-from.getFullYear(), cursor=new Date(from); cursor.setFullYear(cursor.getFullYear()+years);
  if(cursor>to){years--;cursor=new Date(from);cursor.setFullYear(cursor.getFullYear()+years);}
  let months=0; while(true){const next=new Date(cursor);next.setMonth(next.getMonth()+1);if(next<=to){cursor=next;months++;}else break;}
  const days=Math.floor((to-cursor)/DAY); return `${years}y ${months}m ${days}d`;
}

function render(){
  const d=load(),now=new Date(),start=dateAtLocalMidnight(d.careerStart),target=dateAtLocalMidnight(d.retirementDate);
  const serviceYears=serviceYearsAt(start,now),targetYears=serviceYearsAt(start,target);
  const currentPension=pensionAt(d.pensionSalary,serviceYears),targetPension=pensionAt(d.pensionSalary,targetYears);
  const annualAccrual=Number(d.pensionSalary)*(serviceYears<15?0.03:0.035),dailyAccrual=annualAccrual/YEAR_DAYS;
  const totalCareerDays=Math.max(1,(target-start)/DAY),servedDays=Math.max(0,(Math.min(now,target)-start)/DAY),pct=Math.min(100,Math.max(0,servedDays/totalCareerDays*100));

  todayLabel.textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  countdown.textContent=calendarCountdown(now,target);
  targetDateLabel.textContent=`Eligibility: ${target.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
  progressBar.style.width=pct+'%'; careerProgress.textContent=pct.toFixed(1)+'%';
  pensionToday.textContent=preciseMoney(currentPension);
  dailyAccrual.textContent='+'+preciseMoney(dailyAccrual)+'/day';
  monthlyAccrual.textContent=`About ${money(dailyAccrual*30.44)} per month at the current salary basis`;
  pensionAtTarget.textContent=money(targetPension); targetIncrease.textContent=`${money(targetPension-currentPension)} above today`;
  serviceYears.textContent=serviceYears.toFixed(6);
  serviceDetail.textContent=`Hired ${start.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} · ${(serviceYears*YEAR_DAYS).toLocaleString(undefined,{maximumFractionDigits:1})} service days`;
  salaryBasis.textContent=`Based on highest year salary of ${money(d.pensionSalary)}`;

  const invested=investmentTotal(d),equity=Number(d.homeValue)-Number(d.mortgage),net=invested+equity+Number(d.otherAssets)-Number(d.otherDebt);
  netWorth.textContent=money(net); investmentTotalEl.textContent=money(invested); homeEquity.textContent=money(equity); lastUpdated.textContent=formatUpdated(d.balancesUpdatedAt);
  accountList.innerHTML=accountDefinitions.map(([id,name,subtitle])=>`<div class="account-row"><div><strong>${name}</strong><small>${subtitle}</small></div><strong>${money(d[id])}</strong></div>`).join('')+
    `<div class="account-row total-row"><div><strong>Investment total</strong><small>All seven accounts</small></div><strong>${money(invested)}</strong></div>`+
    `<div class="account-row"><div><strong>Home equity</strong><small>${money(d.homeValue)} value − ${money(d.mortgage)} mortgage</small></div><strong>${money(equity)}</strong></div>`;

  const oneYear=Number(d.pensionSalary)*0.035; oneYearPension.textContent='+'+money(oneYear)+'/yr'; fiveYearPension.textContent='+'+money(oneYear*5);
  const r=Number(d.dropReturn)/100,n=Number(d.dropYears),annual=targetPension,drop=r===0?annual*n:annual*((Math.pow(1+r,n)-1)/r); dropValue.textContent=money(drop);
}

function liveTick(){
  const d=load(),now=new Date(),start=dateAtLocalMidnight(d.careerStart);
  pensionToday.textContent=preciseMoney(pensionAt(d.pensionSalary,serviceYearsAt(start,now)));
  serviceYears.textContent=serviceYearsAt(start,now).toFixed(8);
}

function buildBalanceFields(){
  const d=load();
  balanceFields.innerHTML=accountDefinitions.map(([id,name,subtitle])=>`<label class="balance-field"><span><strong>${name}</strong><small>${subtitle}</small></span><div class="money-input"><span>$</span><input id="${id}" inputmode="decimal" type="number" min="0" step="1" value="${Number(d[id]||0)}"></div></label>`).join('');
}
function populateSettings(){const d=load();settingIds.forEach(id=>{const el=document.getElementById(id);if(el)el.value=d[id];});}

settingsBtn.addEventListener('click',()=>{populateSettings();settingsDialog.showModal();});
refreshBtn.addEventListener('click',()=>{buildBalanceFields();balancesDialog.showModal();});
cancelBalances.addEventListener('click',()=>balancesDialog.close());
balancesForm.addEventListener('submit',e=>{
  e.preventDefault(); const d=load();
  accountDefinitions.forEach(([id])=>{d[id]=Number(document.getElementById(id).value||0);});
  d.balancesUpdatedAt=new Date().toISOString(); save(d); balancesDialog.close(); render();
});
settingsForm.addEventListener('submit',e=>{
  e.preventDefault(); const d=load(); settingIds.forEach(id=>{const el=document.getElementById(id);d[id]=el.type==='date'?el.value:Number(el.value||0);});
  save(d); settingsDialog.close(); render();
});
resetBtn.addEventListener('click',()=>{localStorage.removeItem(STORAGE_KEY);save(defaults);populateSettings();render();});

const investmentTotalEl=document.getElementById('investmentTotal');
render(); setInterval(liveTick,1000); setInterval(render,60000);
