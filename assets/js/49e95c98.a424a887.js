"use strict";(self.webpackChunkperf_analysis=self.webpackChunkperf_analysis||[]).push([[4895],{1276:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>r,default:()=>h,frontMatter:()=>i,metadata:()=>o,toc:()=>l});var a=t(4848),s=t(8453);const i={sidebar_position:5},r="Scalasca trace analysis",o={id:"trace_analysis",title:"Scalasca trace analysis",description:"While summary profiles only provide process- or thread-local data aggregated over time, event traces contain detailed time-stamped event data which also allows to reconstruct the dynamic behavior of an application. This enables tools such as the Scalasca trace analyzer to provide even more insights into the performance behavior of an application, for example, whether the time spent in MPI communication is real message processing time or incurs significant wait states (i.e., intervals where a process sits idle without doing useful work waiting for data from other processes to arrive).",source:"@site/docs/trace_analysis.md",sourceDirName:".",slug:"/trace_analysis",permalink:"/perf-analysis-hands-on/docs/trace_analysis",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5},sidebar:"tutorialSidebar",previous:{title:"Explore profile with CUBE",permalink:"/perf-analysis-hands-on/docs/profile_exploration"}},c={},l=[];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.h1,{id:"scalasca-trace-analysis",children:"Scalasca trace analysis"}),"\n",(0,a.jsx)(n.p,{children:"While summary profiles only provide process- or thread-local data aggregated over time, event traces contain detailed time-stamped event data which also allows to reconstruct the dynamic behavior of an application. This enables tools such as the Scalasca trace analyzer to provide even more insights into the performance behavior of an application, for example, whether the time spent in MPI communication is real message processing time or incurs significant wait states (i.e., intervals where a process sits idle without doing useful work waiting for data from other processes to arrive)."}),"\n",(0,a.jsxs)(n.p,{children:["Trace collection and subsequent automatic analysis by the Scalasca trace analyzer can be enabled using the ",(0,a.jsx)(n.code,{children:"-t"})," option of ",(0,a.jsx)(n.code,{children:"scalasca -analyze"}),". Since this option enables trace collection in addition to collecting a summary measurement, it is often used in conjunction with the ",(0,a.jsx)(n.code,{children:"-q"})," option which turns off measurement entirely. (Note that the order in which these two options are specified matters.)"]}),"\n",(0,a.jsx)(n.admonition,{type:"warning",children:(0,a.jsxs)(n.p,{children:["Traces can easily become extremely large and unwieldy, and uncoordinated intermediate trace buffer flushes may result in cascades of distortion, which renders such traces to be of little value. It is therefore extremely important to set up an adequate measurement configuration  (i.e., a filtering file and ",(0,a.jsx)(n.code,{children:"SCOREP_TOTAL_MEMORY"})," setting) before initiating trace collection and analysis!"]})}),"\n",(0,a.jsxs)(n.p,{children:["For our example measurement, scoring of the initial summary report with the filter applied estimated a total memory requirement of 27MB per process (see ",(0,a.jsx)(n.a,{href:"/perf-analysis-hands-on/docs/filtering",children:"scoring report here"}),"). As this exceeds the default ",(0,a.jsx)(n.code,{children:"SCOREP_TOTAL_MEMORY"})," setting of 16MB, use of the prepared filtering file alone is not yet sufficient to avoid intermediate trace buffer flushes. In addition, the ",(0,a.jsx)(n.code,{children:"SCOREP_TOTAL_MEMORY"})," setting has to be adjusted accordingly before starting the trace collection and analysis."]}),"\n",(0,a.jsx)(n.admonition,{type:"info",children:(0,a.jsxs)(n.p,{children:["Renaming or removing the summary experiment directory is not necessary, as trace experiments are created with suffix ",(0,a.jsx)(n.code,{children:"trace"}),"."]})}),"\n",(0,a.jsx)(n.p,{children:"Make sure that all required software is available"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"$ # Load modules if not loaded already\n$ module load intel intel-mpi/2019-intel nano\n$ module use /lrz/sys/courses/vihps/2024/modulefiles/\n$ module load scorep/8.4-intel-intelmpi scalasca/2.6.1-intel-intelmpi\n"})}),"\n",(0,a.jsx)(n.p,{children:"Go to our work directory with already build executable and prepared filtering file"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"$ cd $HOME/tw45/NPB3.3-MZ-MPI/bin.scorep\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Let's copy ",(0,a.jsx)(n.code,{children:"scalasca.sbatch"})," to the current directory"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"$ cp ../jobscript/coolmuc2/scalasca.sbatch .\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Let's examine what ",(0,a.jsx)(n.code,{children:"scalasca.sbatch"})," does by executing ",(0,a.jsx)(n.code,{children:"nano scalasca.batch"})]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",metastring:"showLineNumbers",children:'#!/bin/bash\n#SBATCH -o bt-mz.%j.out\n#SBATCH -e bt-mz.%j.err\n#SBATCH -J bt-mz\n#SBATCH --clusters=cm2_tiny\n#SBATCH --partition=cm2_tiny\n#SBATCH --reservation=hhps1s24\n#SBATCH --nodes=2\n#SBATCH --ntasks=28\n#SBATCH --ntasks-per-node=14\n#SBATCH --get-user-env\n#SBATCH --time=00:05:00\n\nmodule use /lrz/sys/courses/vihps/2024/modulefiles/\nmodule load scorep/8.4-intel-intelmpi scalasca/2.6.1-intel-intelmpi\nexport OMP_NUM_THREADS=4\n\n# Score-P measurement configuration\n\n# highlight-start\nexport SCOREP_FILTERING_FILE=../config/scorep.filt\nexport SCOREP_TOTAL_MEMORY=27MB\n#export SCAN_ANALYZE_OPTS="--time-correct"\n# highlight-end\n\n# Benchmark configuration (disable load balancing with threads)\nexport NPB_MZ_BLOAD=0\nPROCS=28\nCLASS=C\n\n# Run the application\n# highlight-next-line\nscalasca -analyze -t mpiexec -n $SLURM_NTASKS ./bt-mz_$CLASS.$PROCS\n'})}),"\n",(0,a.jsxs)(n.p,{children:["In the first highlighted lines we set the measurement configuration, i.e. use the prepared filter file and set the required amount of memory for tracing based on scoring. And in the last highlighted line we enabled Scalasca trace analysis with the ",(0,a.jsx)(n.code,{children:"-t"})," option."]}),"\n",(0,a.jsx)(n.p,{children:"Now we are ready to submit our batch script"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"sbatch scalasca.sbatch\n"})}),"\n",(0,a.jsxs)(n.p,{children:["After successful trace collection and analysis you should see freshly generated experiment directory ",(0,a.jsx)(n.code,{children:"scorep_bt-mz_C_8x6_trace"}),". Let us examine what is inside this directory:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"$ ls -1 scorep_bt-mz_C_8x6_trace\nMANIFEST.md\nprofile.cubex\nscorep.cfg\nscorep.filter\nscorep.log\nscout.cubex\nscout.log\ntraces\ntraces.def\ntraces.otf2\ntrace.stat\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Among the already known files there are some new ones, e.g. a copy of the filter file ",(0,a.jsx)(n.code,{children:"scorep.filt"}),", an OTF2 trace archive consisting of the anchor file ",(0,a.jsx)(n.code,{children:"traces.otf2"}),", the global definitions file ",(0,a.jsx)(n.code,{children:"traces.def"})," and the per-process data in the ",(0,a.jsx)(n.code,{children:"traces/"})," directory. Finally, the experiment also includes the trace analysis reports ",(0,a.jsx)(n.code,{children:"scout.cubex"})," and ",(0,a.jsx)(n.code,{children:"trace.stat"}),", and a log file containing the output of the trace analyser (",(0,a.jsx)(n.code,{children:"scout.log"}),")."]}),"\n",(0,a.jsxs)(n.p,{children:["Let's examine ",(0,a.jsx)(n.code,{children:"scout.log"})," if the trace analysis was successful:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"$ cat scorep_bt-mz_C_8x6_trace/scout.log\nS=C=A=N: Tue Jun  4 18:42:20 2024: Analyze start\n/dss/dsshome1/lrz/sys/spack/release/22.2.1/opt/x86_64/intel-mpi/2019.12.320-gcc-wx7cjlg/compilers_and_libraries_2020.4.320/linux/mpi/intel64/bin/mpiexec -n 28 /lrz/sys/courses/vihps/2024/tools/scalasca/2.6.1/intel_intelmpi/bin/scout.hyb ./scorep_bt-mz_C_28x4_trace/traces.otf2\nSCOUT   (Scalasca 2.6.1)\nCopyright (c) 1998-2022 Forschungszentrum Juelich GmbH\nCopyright (c) 2014-2021 RWTH Aachen University\nCopyright (c) 2009-2014 German Research School for Simulation Sciences GmbH\n\nAnalyzing experiment archive ./scorep_bt-mz_C_28x4_trace/traces.otf2\n\nOpening experiment archive ... done (0.013s).\nReading definition data    ... done (0.015s).\nReading event trace data   ... done (0.131s).\nPreprocessing              ... done (0.181s).\nAnalyzing trace data       ... done (10.301s).\nWriting analysis report    ... done (0.129s).\n\nMax. memory usage         : 279.777MB\n\nTotal processing time     : 10.841s\nS=C=A=N: Tue Jun  4 18:42:37 2024: Analyze done (status=0) 17s\n"})}),"\n",(0,a.jsx)(n.p,{children:"There are no errors or warnings, so the analysis was successful."}),"\n",(0,a.jsxs)(n.admonition,{type:"info",children:[(0,a.jsxs)(n.p,{children:["Sometimes in ",(0,a.jsx)(n.code,{children:"scout.log"})," the Scalasca trace analyzer warns about point-to-point clock condition violations. These violations happen when the local clocks of individual compute nodes are not properly synchronized, causing logical event order errors. For example, a receive operation might appear to finish before the corresponding send operation starts, which is impossible. Scalasca has a correction algorithm to fix these errors and restore the logical event order, while trying to keep the intervals between local events unchanged."]}),(0,a.jsxs)(n.p,{children:["To use this correction algorithm, you need to pass the ",(0,a.jsx)(n.code,{children:"--time-correct"})," option to the Scalasca trace analyzer. Since the analyzer is started with the ",(0,a.jsx)(n.code,{children:"scalasca -analyze"})," command, you set this option using the ",(0,a.jsx)(n.code,{children:"SCAN_ANALYZE_OPTS"})," environment variable. This variable holds the command-line options for ",(0,a.jsx)(n.code,{children:"scalasca -analyze"})," to pass to the trace analyzer. You can re-analyze an existing trace measurement using the ",(0,a.jsx)(n.code,{children:"-a"})," option with ",(0,a.jsx)(n.code,{children:"scalasca -analyze"}),", so you don't have to collect new data."]}),(0,a.jsx)(n.p,{children:"The additional time required to execute the timestamp correction algorithm is typically small compared to the trace data I/O time and waiting times in the batch queue for starting a second analysis job. On platforms where clock condition violations are likely to occur (i.e., clusters), it is therefore often convenient to enable the timestamp correction algorithm by default."})]}),"\n",(0,a.jsxs)(n.p,{children:["Similar to the summary report, the trace analysis report can finally be postprocessed and interactively explored using the Cube report browser, e.g. by using the ",(0,a.jsx)(n.code,{children:"square"})," command"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"$ square scorep_bt-mz_C_8x6_trace/\nINFO: Post-processing runtime summarization report (profile.cubex)...\nINFO: Post-processing trace analysis report (scout.cubex)...\nINFO: Displaying ./scorep_bt-mz_C_8x6_trace/trace.cubex...\n"})}),"\n",(0,a.jsxs)(n.p,{children:["The report generated by the Scalasca trace analyzer (i.e. ",(0,a.jsx)(n.code,{children:"trace.cubex"}),') is again a profile in CUBE4 format, however, enriched with additional performance properties, e.g. "Delay costs", "Critical path", etc. Examination shows that roughly half of the time spent in MPI point-to-point communication is waiting time, mainly in "Late Sender" wait state.']}),"\n",(0,a.jsx)(n.admonition,{type:"info",children:(0,a.jsxs)(n.p,{children:["A detailed list and description of performance metrics one can be found ",(0,a.jsx)(n.a,{href:"https://apps.fz-juelich.de/scalasca/releases/scalasca/2.6/help/scalasca_patterns.html",children:"here"}),"."]})}),"\n",(0,a.jsxs)(n.p,{children:["While the execution time in the ",(0,a.jsx)(n.code,{children:"x_solve"}),", ",(0,a.jsx)(n.code,{children:"y_solve"})," and ",(0,a.jsx)(n.code,{children:"z_solve"}),' routines looked relatively balanced in the summary profile, examination of the "Imbalance" in "Critical path" metric shows that these routines in fact exhibit a small amount of imbalance, which is likely to cause the wait states at the next synchronization point. This can be verified using the "Late Sender" in "Delay costs" metric, which confirms that the ',(0,a.jsx)(n.code,{children:"x_solve"}),", ",(0,a.jsx)(n.code,{children:"y_solve"})," and ",(0,a.jsx)(n.code,{children:"z_solve"}),' routines are responsible for significant amount of the "Late Sender" wait states.']})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(d,{...e})}):d(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>o});var a=t(6540);const s={},i=a.createContext(s);function r(e){const n=a.useContext(i);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),a.createElement(i.Provider,{value:n},e.children)}}}]);