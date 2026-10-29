import React, { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { AlertTriangle, BookMarked, Check, ChevronDown, ClipboardCopy, Download, FileDown, GraduationCap, KeyRound, Lightbulb, List, NotebookPen } from 'lucide-react';
import { Button, EmptyState } from './UI';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.min.css';

type Heading={text:string;id:string};
function slug(text:string){return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-');}
function textOf(node:any):string {if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(textOf).join('');if(React.isValidElement(node))return textOf((node.props as any).children);if(node?.value)return String(node.value);if(node?.children)return textOf(node.children);return '';}
function stripMarker(children:React.ReactNode,marker:string):React.ReactNode {let stripped=false;const visit=(node:React.ReactNode):React.ReactNode=>{if(typeof node==='string'){if(!stripped&&node.includes(marker)){stripped=true;return node.replace(marker,'').replace(/^\s*:?\s*/,'');}return node;}if(Array.isArray(node))return node.map(visit);if(React.isValidElement(node))return React.cloneElement(node as React.ReactElement<any>,undefined,visit((node.props as any).children));return node;};return visit(children);}

class ReaderBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="ui-error-reader" role="alert">This note contains content that could not be rendered. Use Copy or Download to view the original Markdown.</div>:this.props.children;}}

export function NotesReader({markdown,title='Study Notes'}:{markdown:string;title?:string}) {
  const reader=useRef<HTMLDivElement>(null);const [progress,setProgress]=useState(0);const [font,setFont]=useState(16);const [copied,setCopied]=useState(false);const [tocOpen,setTocOpen]=useState(false);
  const toc=useMemo<Heading[]>(()=>[...markdown.matchAll(/^##\s+(.*)$/gm)].map(m=>({text:m[1].trim(),id:slug(m[1].trim())})),[markdown]);
  const duration=Math.max(1,Math.ceil(markdown.trim().split(/\s+/).length/220));
  function track(){const el=reader.current;if(el)setProgress(el.scrollHeight<=el.clientHeight?100:Math.round(el.scrollTop/(el.scrollHeight-el.clientHeight)*100));}
  function download(){const url=URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${title.replace(/[^\w -]/g,'').slice(0,50)||'study-notes'}.md`;a.click();URL.revokeObjectURL(url);}
  async function copy(){await navigator.clipboard.writeText(markdown);setCopied(true);setTimeout(()=>setCopied(false),1800);}
  async function pdf(){// Hinglish: PDF library sirf export click karne par load hoti hai, initial page fast rehta hai.
    const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'mm',format:'a4'});const margin=17;const maxWidth=176;let y=20;doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text(title.slice(0,85),margin,y);y+=12;doc.setFont('helvetica','normal');doc.setFontSize(10);for(const paragraph of markdown.replace(/[#*`>|]/g,'').split('\n')){const lines=doc.splitTextToSize(paragraph||' ',maxWidth);for(const line of lines){if(y>277){doc.addPage();y=18;}doc.text(line,margin,y);y+=5;}y+=2;}doc.save(`${title.replace(/[^\w -]/g,'').slice(0,50)||'study-notes'}.pdf`);}
  if(!markdown)return <EmptyState feature="notes" icon={<BookMarked/>} title="Your knowledge, beautifully organized" description="Generate a lesson to see a chaptered reader with formulas, examples, tables, code and revision checklists."/>;
  let h2Index=0;
  const components:any={
    h1:({children}:any)=><h1 className="note-h1">{children}</h1>,
    h2:({children}:any)=>{const heading=textOf(children);const number=++h2Index;return <h2 id={slug(heading)} className="note-h2"><span>{number.toString().padStart(2,'0')}</span>{children}</h2>;},
    h3:({children}:any)=><h3 className="note-h3"><span aria-hidden="true"/>{children}</h3>,
    p:({children}:any)=><p className="note-p">{children}</p>,
    ul:({children,className}:any)=><ul className={`note-list ${className||''}`}>{children}</ul>,
    ol:({children}:any)=><ol className="note-list note-ordered">{children}</ol>,
    li:({children,className}:any)=><li className={className||''}>{children}</li>,
    input:({type,checked,...rest}:any)=><input type={type} defaultChecked={checked} aria-label="Revision checklist item" {...rest} disabled={false} />,
    blockquote:({children}:any)=>{const raw=textOf(children);const match=raw.match(/^\s*\[!(NOTE|TIP|WARNING|EXAMPLE|EXAM|KEY)\]/i);if(!match)return <blockquote className="note-quote">{children}</blockquote>;const kind=match[1].toUpperCase();const icons:any={NOTE:BookMarked,TIP:Lightbulb,WARNING:AlertTriangle,EXAMPLE:NotebookPen,EXAM:GraduationCap,KEY:KeyRound};const Icon=icons[kind];return <aside className={`note-callout callout-${kind.toLowerCase()}`}><div className="note-callout-label"><Icon size={16}/>{kind}</div><div>{stripMarker(children,match[0].trim())}</div></aside>;},
    table:({children}:any)=><div className="note-table-wrap" tabIndex={0} role="region" aria-label="Scrollable notes table"><table>{children}</table></div>,
    thead:({children}:any)=><thead>{children}</thead>,
    pre:({children}:any)=>{const code=React.Children.toArray(children).find(React.isValidElement) as any;const name=String(code?.props?.className||'').match(/language-([\w+-]+)/)?.[1]||'code';const raw=textOf(code?.props?.children||children);return <div className="note-code-block"><header><span>{name}</span><button aria-label="Copy code" onClick={()=>void navigator.clipboard.writeText(raw)}><ClipboardCopy size={15}/> Copy</button></header><pre>{children}</pre></div>;},
    code:({children,className}:any)=>className?<code className={className}>{children}</code>:<code className="note-inline-code">{children}</code>,
    a:({href,children}:any)=><a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    hr:()=> <hr className="note-divider"/>
  };
  return (
    <div className="notes-reader feature-notes">
      <div className="reader-toolbar">
        <div className="reader-meta">
          <BookMarked size={16} className="text-[#7C3AED]" />
          <span>{duration} min read</span>
          <span>·</span>
          <span>{toc.length} sections</span>
        </div>
        <div className="reader-actions">
          <div className="flex items-center gap-1 bg-[#F1F3F9] p-1 rounded-full border border-[#E8EAF3]">
            <button
              title="Smaller text"
              aria-label="Decrease font size"
              onClick={() => setFont((v) => Math.max(13, v - 1))}
              className="w-7 h-7 rounded-full bg-white text-xs font-bold shadow-xs hover:bg-slate-50 transition-colors border-0"
            >
              A−
            </button>
            <button
              title="Larger text"
              aria-label="Increase font size"
              onClick={() => setFont((v) => Math.min(21, v + 1))}
              className="w-7 h-7 rounded-full bg-white text-xs font-bold shadow-xs hover:bg-slate-50 transition-colors border-0"
            >
              A+
            </button>
          </div>
          <Button
            feature="notes"
            variant="ghost"
            size="sm"
            onClick={() => void copy()}
            className="rounded-full"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <ClipboardCopy size={14} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          <Button
            feature="notes"
            variant="secondary"
            size="sm"
            onClick={download}
            className="rounded-full"
          >
            <Download size={14} /> .md
          </Button>
          <Button
            feature="notes"
            variant="secondary"
            size="sm"
            onClick={pdf}
            className="rounded-full"
          >
            <FileDown size={14} /> PDF
          </Button>
        </div>
      </div>
      <div
        className="reader-progress"
        aria-label={`${progress}% read`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    <div className="reader-layout"><div className="reader-scroll" ref={reader} onScroll={track}><ReaderBoundary key={markdown}><article className="note-content" style={{fontSize:font}}><ReactMarkdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[rehypeKatex,rehypeHighlight]} components={components}>{markdown}</ReactMarkdown></article></ReaderBoundary></div>
      {toc.length>0&&<aside className="reader-toc"><button className="reader-toc-toggle" onClick={()=>setTocOpen(!tocOpen)} aria-expanded={tocOpen}><List size={16}/> On this page <ChevronDown size={16}/></button><nav className={tocOpen?'open':''} aria-label="Table of contents">{toc.map((heading,i)=><button key={`${heading.id}-${i}`} onClick={()=>{const el=reader.current?.querySelector<HTMLElement>(`#${CSS.escape(heading.id)}`);el?.scrollIntoView({behavior:'smooth',block:'start'});setTocOpen(false);}}>{heading.text}</button>)}</nav></aside>}
    </div>
  </div>
  );
}
