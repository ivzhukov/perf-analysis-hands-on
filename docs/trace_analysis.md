---
sidebar_position: 5
---
# Scalasca trace analysis

While summary profiles only provide process- or thread-local data aggregated over time, event traces contain detailed time-stamped event data which also allows to reconstruct the dynamic behavior of an application. This enables tools such as the Scalasca trace analyzer to provide even more insights into the performance behavior of an application, for example, whether the time spent in MPI communication is real message processing time or incurs significant wait states (i.e., intervals where a process sits idle without doing useful work waiting for data from other processes to arrive).

Trace collection and subsequent automatic analysis by the Scalasca trace analyzer can be enabled using the `-t` option of `scalasca -analyze`. Since this option enables trace collection in addition to collecting a summary measurement, it is often used in conjunction with the `-q` option which turns off measurement entirely. (Note that the order in which these two options are specified matters.)

:::warning

Traces can easily become extremely large and unwieldy, and uncoordinated intermediate trace buffer flushes may result in cascades of distortion, which renders such traces to be of little value. It is therefore extremely important to set up an adequate measurement configuration  (i.e., a filtering file and `SCOREP_TOTAL_MEMORY` setting) before initiating trace collection and analysis!

:::

For our example measurement, scoring of the initial summary report with the filter applied estimated a total memory requirement of 27MB per process (see [scoring report here](./filtering.md)). As this exceeds the default `SCOREP_TOTAL_MEMORY` setting of 16MB, use of the prepared filtering file alone is not yet sufficient to avoid intermediate trace buffer flushes. In addition, the `SCOREP_TOTAL_MEMORY` setting has to be adjusted accordingly before starting the trace collection and analysis. 

:::info

Renaming or removing the summary experiment directory is not necessary, as trace experiments are created with suffix `trace`.

:::

Make sure that all required software is available
```bash
$ # Load modules if not loaded already
$ module load gcc/10.2.0 openmpi/4.0.5-gcc10.2.0
$ module use /jet/home/zhukov/ihpcss25/modules/
$ module load scorep/8.4-gcc_openmpi scalasca/2.6-gcc_openmpi
```

Go to our work directory with already build executable and prepared filtering file 
```bash
$ cd $HOME/ihpcss25/NPB3.3-MZ-MPI/bin.scorep
```

Let's copy `scalasca.sbatch.C.8` to the current directory
```bash
$ cp ../jobscript/bridges2/scalasca.sbatch.C.8 .
```

Let's examine what `scalasca.sbatch.C.8` does by executing `nano scalasca.sbatch.C.8`
```bash showLineNumbers
#SBATCH -J mzmpibt             # job name
#SBATCH -o trace-C.8-%j.out    # stdout output file
#SBATCH -e trace-C.8-%j.err    # stderr output file
#SBATCH --nodes=2              # requested nodes
#SBATCH --ntasks=8             # requested MPI tasks
#SBATCH --ntasks-per-node=4
#SBATCH --cpus-per-task=6      # requested logical CPUs/threads per task
#SBATCH --partition RM         # partition to use
#SBATCH --account=tra210016p   # account to charge
#SBATCH --export=ALL           # export env varibales
#SBATCH --time=00:10:00        # max wallclock time (hh:mm:ss)

# setup modules, add tools to PATH
set -x
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

module use /jet/home/zhukov/ihpcss25/modules/
module load gcc/10.2.0 openmpi/4.0.5-gcc10.2.0 scorep/8.4-gcc_openmpi scalasca/2.6-gcc_openmpi

# benchmark configuration
export NPB_MZ_BLOAD=0
CLASS=C
PROCS=$SLURM_NTASKS
EXE=./bt-mz_$CLASS.$PROCS

# Score-P measurement configuration
# highlight-start
export SCOREP_FILTERING_FILE=../config/scorep.filt
export SCOREP_TOTAL_MEMORY=95MB
#export SCAN_ANALYZE_OPTS="--time-correct"
# highlight-end

# Run the application
# highlight-next-line
scalasca -analyze -t mpirun -n $SLURM_NTASKS $EXE
```
In the first highlighted lines we set the measurement configuration, i.e. use the prepared filter file and set the required amount of memory for tracing based on scoring. And in the last highlighted line we enabled Scalasca trace analysis with the `-t` option.

Now we are ready to submit our batch script
```bash
sbatch scalasca.sbatch.C.8
```

After successful trace collection and analysis you should see freshly generated experiment directory `scorep_bt-mz_C_8x6_trace`. Let us examine what is inside this directory:
```bash
$ ls -1 scorep_bt-mz_C_8x6_trace
MANIFEST.md
profile.cubex
scorep.cfg
scorep.filter
scorep.log
scout.cubex
scout.log
traces
traces.def
traces.otf2
trace.stat
```
Among the already known files there are some new ones, e.g. a copy of the filter file `scorep.filt`, an OTF2 trace archive consisting of the anchor file `traces.otf2`, the global definitions file `traces.def` and the per-process data in the `traces/` directory. Finally, the experiment also includes the trace analysis reports `scout.cubex` and `trace.stat`, and a log file containing the output of the trace analyser (`scout.log`).

Let's examine `scout.log` if the trace analysis was successful:
```
S=C=A=N: Thu Jun 16 07:40:59 2025: Analyze start
/jet/packages/spack/opt/spack/linux-centos8-zen2/gcc-10.2.0/openmpi-4.0.5-i77nnmggpclrp6x53f7e5vpc4afn5p5c/bin/mpirun -n 8 /jet/home/zhukov/ihpcss25/tools/scalasca/2.6.1/gcc_openmpi/bin/scout.hyb ./scorep_bt-mz_C_8x6_trace/traces.otf2
SCOUT   (Scalasca 2.6.1)
Copyright (c) 1998-2022 Forschungszentrum Juelich GmbH
Copyright (c) 2014-2021 RWTH Aachen University
Copyright (c) 2009-2014 German Research School for Simulation Sciences GmbH

Analyzing experiment archive ./scorep_bt-mz_C_8x6_trace/traces.otf2

Opening experiment archive ... done (0.007s).
Reading definition data    ... done (0.003s).
Reading event trace data   ... done (0.238s).
Preprocessing              ... done (0.501s).
Analyzing trace data       ... done (12.885s).
Writing analysis report    ... done (0.125s).

Max. memory usage         : 919.910MB

Total processing time     : 13.860s
S=C=A=N: Thu Jun 16 07:41:14 2025: Analyze done (status=0) 15s
```
There are no errors or warnings, so the analysis was successful. 

:::info

Sometimes in `scout.log` the Scalasca trace analyzer warns about point-to-point clock condition violations. These violations happen when the local clocks of individual compute nodes are not properly synchronized, causing logical event order errors. For example, a receive operation might appear to finish before the corresponding send operation starts, which is impossible. Scalasca has a correction algorithm to fix these errors and restore the logical event order, while trying to keep the intervals between local events unchanged.

To use this correction algorithm, you need to pass the `--time-correct` option to the Scalasca trace analyzer. Since the analyzer is started with the `scalasca -analyze` command, you set this option using the `SCAN_ANALYZE_OPTS` environment variable. This variable holds the command-line options for `scalasca -analyze` to pass to the trace analyzer. You can re-analyze an existing trace measurement using the `-a` option with `scalasca -analyze`, so you don't have to collect new data.

The additional time required to execute the timestamp correction algorithm is typically small compared to the trace data I/O time and waiting times in the batch queue for starting a second analysis job. On platforms where clock condition violations are likely to occur (i.e., clusters), it is therefore often convenient to enable the timestamp correction algorithm by default.

:::

Similar to the summary report, the trace analysis report can finally be postprocessed and interactively explored using the Cube report browser, e.g. by using the `square` command
```
$ square scorep_bt-mz_C_8x6_trace/
INFO: Post-processing runtime summarization report (profile.cubex)...
INFO: Post-processing trace analysis report (scout.cubex)...
INFO: Displaying ./scorep_bt-mz_C_8x6_trace/trace.cubex...
```

The report generated by the Scalasca trace analyzer (i.e. `trace.cubex`) is again a profile in CUBE4 format, however, enriched with additional performance properties, e.g. "Delay costs", "Critical path", etc. Examination shows that roughly half of the time spent in MPI point-to-point communication is waiting time, mainly in "Late Sender" wait state.

:::info

A detailed list and description of performance metrics one can be found [here](https://apps.fz-juelich.de/scalasca/releases/scalasca/2.6/help/scalasca_patterns.html).

:::

 While the execution time in the `x_solve`, `y_solve` and `z_solve` routines looked relatively balanced in the summary profile, examination of the "Imbalance" in "Critical path" metric shows that these routines in fact exhibit a small amount of imbalance, which is likely to cause the wait states at the next synchronization point. This can be verified using the "Late Sender" in "Delay costs" metric, which confirms that the `x_solve`, `y_solve` and `z_solve` routines are responsible for significant amount of the "Late Sender" wait states. 
