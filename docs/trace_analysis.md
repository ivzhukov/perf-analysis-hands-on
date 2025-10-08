---
sidebar_position: 5
---
# Scalasca trace analysis

While summary profiles only provide process- or thread-local data aggregated over time, event traces contain detailed time-stamped event data which also allows to reconstruct the dynamic behavior of an application. This enables tools such as the Scalasca trace analyzer to provide even more insights into the performance behavior of an application, for example, whether the time spent in MPI communication is real message processing time or incurs significant wait states (i.e., intervals where a process sits idle without doing useful work waiting for data from other processes to arrive).

Trace collection and subsequent automatic analysis by the Scalasca trace analyzer can be enabled using the `-t` option of `scalasca -analyze`. Since this option enables trace collection in addition to collecting a summary measurement, it is often used in conjunction with the `-q` option which turns off measurement entirely. (Note that the order in which these two options are specified matters.)

:::warning

Traces can easily become extremely large and unwieldy, and uncoordinated intermediate trace buffer flushes may result in cascades of distortion, which renders such traces to be of little value. It is therefore extremely important to set up an adequate measurement configuration  (i.e., a filtering file and `SCOREP_TOTAL_MEMORY` setting) before initiating trace collection and analysis!

:::

For our example measurement, scoring of the initial summary report with the filter applied estimated a total memory requirement of 59MB per process (see [scoring report here](./filtering.md)). As this exceeds the default `SCOREP_TOTAL_MEMORY` setting of 16MB, use of the prepared filtering file alone is not yet sufficient to avoid intermediate trace buffer flushes. In addition, the `SCOREP_TOTAL_MEMORY` setting has to be adjusted accordingly before starting the trace collection and analysis. 

:::info

Renaming or removing the summary experiment directory is not necessary, as trace experiments are created with suffix `trace`.

:::

Make sure that all required software is available
```bash
$ # Reload modules if needed
$ module load compiler/gcc/14.2.0 mpi/openmpi/5.0.7-gcc-14.2.0
$ # Load additional software being used in the following steps
$ module load score-p cube scalasca
```

Go to our work directory with already build executable and prepared filtering file 
```bash
$ cd $HOME/performance_analysis/NPB3.3-MZ-MPI/bin.scorep
```

Let's copy `scalasca.pbs` to the current directory
```bash
$ cp ../jobscript/hlrs_training/scalasca.pbs .
```

Let's examine what `scalasca.pbs` does by executing `nano scalasca.pbs`
```bash showLineNumbers
#!/bin/bash
# submit from ./bin subdirectory with "qsub reference.pbs"
#
#PBS -N mzmpibt
#PBS -l select=2:node_type=skl:mem=10gb:mpiprocs=4:ncpus=20
#PBS -l place=scatter
#PBS -q smp
#PBS -l walltime=00:10:00

cd $PBS_O_WORKDIR

# Benchmark configuration
export NPB_MZ_BLOAD=0
export OMP_NUM_THREADS=10
CLASS=B
NPROCS=8
EXE=./bt-mz_$CLASS.$NPROCS

module load score-p cube scalasca

# Score-P measurement configuration
# highlight-start
export SCOREP_FILTERING_FILE=../config/scorep.filt
export SCOREP_TOTAL_MEMORY=59M
export SCAN_ANALYZE_OPTS="--time-correct"
# highlight-end
#export SCOREP_METRIC_PAPI=PAPI_TOT_INS,PAPI_TOT_CYC

# Run the application
# highlight-next-line
scalasca -analyze -t mpirun --report-bindings $EXE
```
In the first highlighted lines we set the measurement configuration, i.e. use the prepared filter file and set the required amount of memory for tracing based on scoring. And in the last highlighted line we enabled Scalasca trace analysis with the `-t` option.

Now we are ready to submit our batch script
```bash
qsub scalasca.pbs
```

After successful trace collection and analysis you should see freshly generated experiment directory `scorep_bt-mz_B_Ox10_trace`. Let us examine what is inside this directory:
```bash
$ ls -1 scorep_bt-mz_B_Ox10_trace
MANIFEST.md
profile.cubex
scorep.cfg
scorep.filter
scorep.log
scout.cubex
scout.err
scout.log
traces
traces.def
traces.otf2
trace.stat
```
Among the already known files there are some new ones, e.g. a copy of the filter file `scorep.filt`, an OTF2 trace archive consisting of the anchor file `traces.otf2`, the global definitions file `traces.def` and the per-process data in the `traces/` directory. Finally, the experiment also includes the trace analysis reports `scout.cubex` and `trace.stat`, and a log file containing the output of the trace analyser (`scout.log`).

Let's examine `scout.log` if the trace analysis was successful:
```
S=C=A=N: Wed Oct  8 19:27:54 2025: Analyze start
/opt/hlrs/non-spack/mpi/openmpi/5.0.7-gcc-14.2.0/bin/mpirun --report-bindings /opt/training/non-spack/scalasca/2.6.2/bin/scout.hyb --time-correct ./scorep_bt-mz_B_Ox10_trace/traces.otf2
SCOUT   (Scalasca 2.6.2)
Copyright (c) 1998-2025 Forschungszentrum Juelich GmbH
Copyright (c) 2014-2022 RWTH Aachen University
Copyright (c) 2009-2014 German Research School for Simulation Sciences GmbH

Analyzing experiment archive ./scorep_bt-mz_B_Ox10_trace/traces.otf2

Opening experiment archive ... done (0.001s).
Reading definition data    ... done (0.001s).
Reading event trace data   ... done (0.338s).
Preprocessing              ... done (6.120s).
Timestamp correction       ... done (22.902s).
Analyzing trace data       ... done (107.778s).
Writing analysis report    ... done (0.369s).

Max. memory usage         : 534.453MB

	# passes        : 1
	# violated      : 3
	# corrected     : 3880
	# reversed-p2p  : 0
	# reversed-coll : 3
	# reversed-omp  : 0
	# events        : 17727710
	max. error      : 0.000000 [s]
	error at final. : 0.000000 [%]
	Max slope       : 0.010000000

Total processing time     : 137.582s
S=C=A=N: Wed Oct  8 19:30:14 2025: Analyze done (status=0) 140s
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
INFO: Displaying ./scorep_bt-mz_B_Ox10_trace/trace.cubex...
```

The report generated by the Scalasca trace analyzer (i.e. `trace.cubex`) is again a profile in CUBE4 format, however, enriched with additional performance properties, e.g. "Delay costs", "Critical path", etc. Examination shows that roughly half of the time spent in MPI point-to-point communication is waiting time, mainly in "Late Sender" wait state.

:::info

A detailed list and description of performance metrics one can be found [here](https://apps.fz-juelich.de/scalasca/releases/scalasca/2.6/help/scalasca_patterns.html).

:::

 While the execution time in the `x_solve`, `y_solve` and `z_solve` routines looked relatively balanced in the summary profile, examination of the "Imbalance" in "Critical path" metric shows that these routines in fact exhibit a small amount of imbalance, which is likely to cause the wait states at the next synchronization point. This can be verified using the "Late Sender" in "Delay costs" metric, which confirms that the `x_solve`, `y_solve` and `z_solve` routines are responsible for significant amount of the "Late Sender" wait states. 
