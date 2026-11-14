/* 仅用于官网宣传的本地播放计时，不创建订单或发起支付。 */
window.createShowcasePlayer=function({count,change,bar,time,label,duration=4200}){
let index=0,elapsed=0,start=0,frame=null,playing=false,lastTenth=-1;
const fill=bar.querySelector('.showcase-progress-fill');
function paint(){const complete=index===count()-1;const ratio=complete?1:elapsed/duration;fill.style.width=`${Math.max(0,Math.min(1,ratio))*100}%`;bar.setAttribute('aria-valuenow',Math.round(ratio*100));
const tenth=Math.ceil((duration-elapsed)/100);const message=complete?'演示已完成':`${playing?'距下一步':'已暂停 · 下一步'} ${(Math.max(0,tenth)/10).toFixed(1)} 秒`;if(time.textContent!==message)time.textContent=message;lastTenth=tenth;if(label)label.textContent=`第 ${index+1} / ${count()} 步`;}
function stop(){if(playing)elapsed=Math.min(duration,performance.now()-start);playing=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;paint()}
function emit(){change(index,playing);paint()}
function tick(now){if(!playing)return;elapsed=now-start;if(elapsed>=duration){index++;elapsed=0;start=now;if(index>=count()-1){index=count()-1;playing=false;frame=null;emit();return}emit()}paint();frame=requestAnimationFrame(tick)}
return {play(){if(playing)return;if(index>=count()-1){index=0;elapsed=0}playing=true;start=performance.now()-elapsed;emit();frame=requestAnimationFrame(tick)},pause(){stop();emit()},toggle(){playing?this.pause():this.play()},go(i){stop();index=Math.min(count()-1,Math.max(0,i));elapsed=0;lastTenth=-1;emit()},next(){this.go(index+1)},reset(auto=false){this.go(0);if(auto)this.play()},get playing(){return playing},get index(){return index}};
};
