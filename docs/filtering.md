---
sidebar_position: 3
---
# Filtering

Congratulations, we have made our first measurement with Score-P. But how good was the measurement?
The measured execution gave the desired valid result, but the execution took a bit longer than expected! The instrumented run has a large increase in runtime compared to a baseline (around 48s versus 14s). Your runtime may vary slightly from our measurements. Even if we ignore the start and end of the measurement, it was probably prolonged by the instrumentation/measurement overhead.

To make sure you don't draw the wrong conclusions based on data that has been disturbed by significant overhead, it's often a good idea to optimise the measurement configuration before you do any more experiments. There are lots of ways you can do this, for example, by using runtime filtering, selective recording, or manual instrumentation to control the measurement.

However, in many cases, it's enough to filter a few frequently executed but otherwise unimportant user functions to reduce the measurement overhead to an acceptable level (based on experience, we consider 0-20% of runtime dilation as acceptable). The selection of those routines has to be done with care, though, as it affects the granularity of the measurement and too aggressive filtering might "blur" the location of important hotspots.

To understand where the overhead is coming from it is necessary to make scoring of the measurement. It can be done via the following command:
```bash
$ scorep-score scorep_bt-mz_C_8x6_sum/profile.cubex 
```

As an output you will see the following:
```
Estimated aggregate size of event trace:                   160GB
Estimated requirements for largest trace buffer (max_buf): 21GB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       21GB
(warning: The memory requirements cannot be satisfied by Score-P to avoid
 intermediate flushes when tracing. Set SCOREP_TOTAL_MEMORY=4G to get the
 maximum supported memory or reduce requirements using USR regions filters.)

flt     type     max_buf[B]        visits time[s] time[%] time/visit[us]  region
         ALL 21,518,477,721 6,591,910,449 2290.22   100.0           0.35  ALL
         USR 21,431,996,118 6,574,793,529  933.34    40.8           0.14  USR
         OMP     83,841,856    16,359,424 1342.77    58.6          82.08  OMP
         COM      2,351,570       723,560    2.61     0.1           3.60  COM
         MPI        288,136        33,928   11.50     0.5         339.05  MPI
      SCOREP             41             8    0.00     0.0          82.14  SCOREP
```

As can be seen from the top of the score output, the estimated size for an event trace measurement without filtering applied is approximately 160GB, with the process-local maximum across all ranks being roughly 21GB.

The next section of the score output provides a table which shows how the trace memory requirements of a single process (column `max_buf`) as well as the overall number of visits and CPU allocation time are distributed among certain function groups. In current execution, the following groups are distinguished:
* `ALL`: All functions of the application.
* `MPI`: MPI API functions.
* `OMP`: OpenMP constructs and API functions.
* `COM`: User functions/regions that appear on a call path to an OpenMP construct, or an OpenMP or MPI API function. Useful to provide the context of MPI/OpenMP usage.
* `USR`: User functions/regions that do not appear on a call path to an OpenMP construct, or an OpenMP or MPI API function.
* `SCOREP`: This group aggregates activities within the measurement system.

:::info

There are more function groups available, e.g. `CUDA`,`OPENACC`,`MEMORY`,`IO`,`LIB`, etc. For more details consult with the documentation [here](https://perftools.pages.jsc.fz-juelich.de/cicd/scorep/tags/latest/html/score.html).

:::

As we can see from the scoring output, the `USR` group is making the biggest contribution to the trace memory requirements. To figure out which routines are causing the problem, we need to see a breakdown by function. To do this, we just need to run the following command:

```bash
$ scorep-score -r scorep_bt-mz_C_8x6_sum/profile.cubex
```
As an output you will see the following
```bash
Estimated aggregate size of event trace:                   160GB
Estimated requirements for largest trace buffer (max_buf): 21GB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       21GB
(warning: The memory requirements cannot be satisfied by Score-P to avoid
 intermediate flushes when tracing. Set SCOREP_TOTAL_MEMORY=4G to get the
 maximum supported memory or reduce requirements using USR regions filters.)

flt     type     max_buf[B]        visits time[s] time[%] time/visit[us]  region
         ALL 21,518,477,721 6,591,910,449 2290.22   100.0           0.35  ALL
         USR 21,431,996,118 6,574,793,529  933.34    40.8           0.14  USR
         OMP     83,841,856    16,359,424 1342.77    58.6          82.08  OMP
         COM      2,351,570       723,560    2.61     0.1           3.60  COM
         MPI        288,136        33,928   11.50     0.5         339.05  MPI
      SCOREP             41             8    0.00     0.0          82.14  SCOREP
# highlight-start
         USR  6,883,222,086 2,110,313,472  389.24    17.0           0.18  binvcrhs
         USR  6,883,222,086 2,110,313,472  296.09    12.9           0.14  matmul_sub
         USR  6,883,222,086 2,110,313,472  218.40     9.5           0.10  matvec_sub
         USR    293,617,584    87,475,200   12.77     0.6           0.15  lhsinit
         USR    293,617,584    87,475,200   10.24     0.4           0.12  binvrhs
         USR    224,028,792    68,892,672    6.60     0.3           0.10  exact_solution
# highlight-end
         OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:204
         OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:215
         OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:244
         OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:255
         OMP      3,374,208       310,272    0.74     0.0           2.38  !$omp parallel @rhs.f:28
         OMP      3,357,504       308,736    0.08     0.0           0.25  !$omp parallel @add.f:22
         OMP      3,357,504       308,736    0.12     0.0           0.39  !$omp parallel @z_solve.f:43
         OMP      3,357,504       308,736    0.12     0.0           0.39  !$omp parallel @y_solve.f:43
         OMP      3,357,504       308,736    0.13     0.0           0.41  !$omp parallel @x_solve.f:46
         OMP      2,006,784       617,472    0.93     0.0           1.51  !$omp do @exch_qbc.f:204
         OMP      2,006,784       617,472    0.71     0.0           1.15  !$omp implicit barrier @exch_qbc.f:213
         OMP      2,006,784       617,472    1.18     0.1           1.91  !$omp do @exch_qbc.f:215
         OMP      2,006,784       617,472    0.72     0.0           1.17  !$omp implicit barrier @exch_qbc.f:224
         OMP      2,006,784       617,472    0.86     0.0           1.39  !$omp do @exch_qbc.f:244
         OMP      2,006,784       617,472    0.73     0.0           1.18  !$omp implicit barrier @exch_qbc.f:253
         OMP      2,006,784       617,472    1.26     0.1           2.04  !$omp do @exch_qbc.f:255
         OMP      2,006,784       617,472    0.72     0.0           1.16  !$omp implicit barrier @exch_qbc.f:264
         OMP      1,008,384       310,272    1.16     0.1           3.75  !$omp implicit barrier @rhs.f:439
         OMP      1,008,384       310,272   12.81     0.6          41.29  !$omp do @rhs.f:37
         OMP      1,008,384       310,272    7.02     0.3          22.63  !$omp do @rhs.f:62
         OMP      1,008,384       310,272    5.27     0.2          16.99  !$omp implicit barrier @rhs.f:72
         OMP      1,008,384       310,272   16.51     0.7          53.20  !$omp do @rhs.f:80
         OMP      1,008,384       310,272   15.48     0.7          49.89  !$omp do @rhs.f:191
         OMP      1,008,384       310,272   11.03     0.5          35.55  !$omp do @rhs.f:301
         OMP      1,008,384       310,272    6.28     0.3          20.22  !$omp implicit barrier @rhs.f:353
         OMP      1,008,384       310,272    1.05     0.0           3.39  !$omp do @rhs.f:359
         OMP      1,008,384       310,272    0.65     0.0           2.09  !$omp do @rhs.f:372
         OMP      1,008,384       310,272    6.47     0.3          20.84  !$omp do @rhs.f:384
         OMP      1,008,384       310,272    0.84     0.0           2.70  !$omp do @rhs.f:400
         OMP      1,008,384       310,272    0.45     0.0           1.45  !$omp do @rhs.f:413
         OMP      1,008,384       310,272    1.70     0.1           5.47  !$omp implicit barrier @rhs.f:423
         OMP      1,008,384       310,272    1.99     0.1           6.40  !$omp do @rhs.f:428
         OMP      1,003,392       308,736    8.06     0.4          26.12  !$omp do @add.f:22
         OMP      1,003,392       308,736    2.17     0.1           7.02  !$omp implicit barrier @add.f:33
         OMP      1,003,392       308,736  118.95     5.2         385.27  !$omp implicit barrier @z_solve.f:428
         OMP      1,003,392       308,736  282.02    12.3         913.47  !$omp do @z_solve.f:52
         OMP      1,003,392       308,736  135.33     5.9         438.33  !$omp implicit barrier @y_solve.f:406
         OMP      1,003,392       308,736  284.72    12.4         922.22  !$omp do @y_solve.f:52
         OMP      1,003,392       308,736  132.39     5.8         428.82  !$omp implicit barrier @x_solve.f:407
         OMP      1,003,392       308,736  271.75    11.9         880.21  !$omp do @x_solve.f:54
         COM        668,928       205,824    0.68     0.0           3.33  copy_x_face
         COM        668,928       205,824    0.66     0.0           3.23  copy_y_face
         COM        168,064        51,712    0.20     0.0           3.79  compute_rhs
         OMP        168,064        51,712    0.02     0.0           0.37  !$omp master @rhs.f:74
         OMP        168,064        51,712    0.01     0.0           0.20  !$omp master @rhs.f:183
         OMP        168,064        51,712    0.01     0.0           0.21  !$omp master @rhs.f:293
         OMP        168,064        51,712    0.01     0.0           0.12  !$omp master @rhs.f:424
         COM        167,232        51,456    0.09     0.0           1.71  adi
         COM        167,232        51,456    0.21     0.0           4.02  x_solve
         COM        167,232        51,456    0.20     0.0           3.83  y_solve
         COM        167,232        51,456    0.20     0.0           3.81  z_solve
         COM        167,232        51,456    0.19     0.0           3.69  add
         MPI        125,223        11,256    0.04     0.0           3.46  MPI_Irecv
         MPI        125,223        11,256    0.08     0.0           6.95  MPI_Isend
         MPI         36,582        11,256    9.68     0.4         859.58  MPI_Waitall
         OMP         33,408         3,072    0.00     0.0           1.24  !$omp parallel @initialize.f:28
         USR         31,876         9,808    0.00     0.0           0.11  get_comm_index
         OMP         24,960         7,680    0.00     0.0           0.11  !$omp atomic @error.f:51
         OMP         24,960         7,680    0.00     0.0           0.11  !$omp atomic @error.f:104
         OMP         16,704         1,536    0.00     0.0           0.82  !$omp parallel @exact_rhs.f:21
         OMP         16,704         1,536    0.00     0.0           1.33  !$omp parallel @error.f:27
         OMP         16,704         1,536    0.00     0.0           1.31  !$omp parallel @error.f:86
         OMP          9,984         3,072    0.06     0.0          20.64  !$omp implicit barrier @initialize.f:204
         OMP          9,984         3,072    0.13     0.0          41.65  !$omp do @initialize.f:31
         OMP          9,984         3,072    5.10     0.2        1660.59  !$omp do @initialize.f:50
         OMP          9,984         3,072    0.03     0.0           9.45  !$omp do @initialize.f:100
         OMP          9,984         3,072    0.03     0.0           9.34  !$omp do @initialize.f:119
         OMP          9,984         3,072    0.04     0.0          13.92  !$omp do @initialize.f:137
         OMP          9,984         3,072    0.04     0.0          14.12  !$omp do @initialize.f:156
         OMP          9,984         3,072    1.59     0.1         517.82  !$omp implicit barrier @initialize.f:167
         OMP          9,984         3,072    0.03     0.0           9.93  !$omp do @initialize.f:174
         OMP          9,984         3,072    0.03     0.0           9.91  !$omp do @initialize.f:192
         COM          5,226         1,608    0.13     0.0          83.03  exch_qbc
         OMP          4,992         1,536    0.00     0.0           2.96  !$omp implicit barrier @exact_rhs.f:357
         OMP          4,992         1,536    0.14     0.0          92.49  !$omp do @exact_rhs.f:31
         OMP          4,992         1,536    0.11     0.0          71.58  !$omp implicit barrier @exact_rhs.f:41
         OMP          4,992         1,536    0.43     0.0         281.63  !$omp do @exact_rhs.f:46
         OMP          4,992         1,536    0.43     0.0         277.83  !$omp do @exact_rhs.f:147
         OMP          4,992         1,536    0.37     0.0         241.57  !$omp implicit barrier @exact_rhs.f:242
         OMP          4,992         1,536    0.42     0.0         275.60  !$omp do @exact_rhs.f:247
         OMP          4,992         1,536    0.16     0.0         105.84  !$omp implicit barrier @exact_rhs.f:341
         OMP          4,992         1,536    0.02     0.0          12.54  !$omp do @exact_rhs.f:346
         OMP          4,992         1,536    0.13     0.0          85.93  !$omp implicit barrier @error.f:54
         OMP          4,992         1,536    0.43     0.0         278.02  !$omp do @error.f:33
         OMP          4,992         1,536    0.00     0.0           1.23  !$omp implicit barrier @error.f:107
         OMP          4,992         1,536    0.01     0.0           3.39  !$omp do @error.f:91
         COM          1,664           512    0.02     0.0          46.29  initialize
         COM            832           256    0.00     0.0           3.21  exact_rhs
         COM            832           256    0.00     0.0           4.12  rhs_norm
         COM            832           256    0.00     0.0           3.70  error_norm
         MPI            612            72    0.01     0.0         190.65  MPI_Bcast
         USR            572           176    0.00     0.0           0.20  timer_clear
         MPI            204            24    0.01     0.0         444.82  MPI_Reduce
         MPI            136            16    0.13     0.0        7954.37  MPI_Barrier
         MPI             52            16    0.00     0.0           0.87  MPI_Comm_rank
      SCOREP             41             8    0.00     0.0          82.14  bt-mz_C.8
         COM             26             8    0.02     0.0        2183.25  bt
         USR             26             8    0.00     0.0           0.62  set_constants
         USR             26             8    0.00     0.0          14.43  zone_starts
         USR             26             8    0.00     0.0           2.94  zone_setup
         COM             26             8    0.00     0.0         104.45  verify
         USR             26             8    0.00     0.0         535.67  map_zones
         COM             26             8    0.00     0.0          43.67  env_setup
         COM             26             8    0.00     0.0         579.06  mpi_setup
         USR             26             1    0.00     0.0          76.21  print_results
         USR             26             8    0.00     0.0           0.36  timer_read
         USR             26             8    0.00     0.0          16.62  timer_stop
         USR             26             8    0.00     0.0         518.54  timer_start
         MPI             26             8    0.00     0.0           4.80  MPI_Comm_size
         MPI             26             8    0.00     0.0         129.90  MPI_Comm_split
         MPI             26             8    0.01     0.0        1046.21  MPI_Finalize
         MPI             26             8    1.55     0.1      193698.22  MPI_Init_thread
```

The detailed breakdown by region below the summary provides a classification according to these function groups (column type) for each region found in the summary report. Investigation of this part of the score report reveals that most of the trace data would be generated by about 6.8 billion calls to each of the three routines `binvcrhs`, `matmul_sub` and `matvec_sub` (these routines are highlighted), which are classified as `USR`. And although the percentage of time spent in these routines at first glance suggest that they are important, the average time per visit is below 180 nanoseconds (column `time/visit`). That is, the relative measurement overhead for these functions is substantial, and thus a significant amount of the reported time is very likely spent in the Score-P measurement system rather than in the application itself. Therefore, these routines constitute good candidates for being filtered (like they are good candidates for being inlined by the compiler). Additionally selecting the `lhsinit`, `binvrhs`, and `exact_solution` routines, which generates about 810MB of event data on a single rank with very little runtime impact.

Score-P allows users to exclude specific routines or files from being measured using a filter file. This file, written in a specific format, specifies what should be included or excluded. In our case, we define rules for certain functions between the keywords `SCOREP_REGION_NAMES_BEGIN` and `SCOREP_REGION_NAMES_END`, the keyword `EXCLUDE` indicating that functions must be excluded from the measurements. A typical Score-P filter file looks like this:
```
SCOREP_REGION_NAMES_BEGIN
  EXCLUDE
    binvcrhs
    matmul_sub
    matvec_sub
    lhsinit
    binvrhs
    exact_solution
SCOREP_REGION_NAMES_END
```

We have prepared a filter file `scorep.filter`, which you can find here `NPB3.3-MZ-MPI/config/scorep.filt`. You may notice some differences from the example above, such as the use of asterisks (`*`) as bash wildcards, because some Fortran compilers handle `_` symbols in function names differently. We have also excluded timer functions from the measurement. 

:::info

Just to let you know that the filter is safe to use. It doesn't prevent any of the listed routines from being executed. They are simply not recorded in the measurement, so they won't appear in the profile/trace explorer. 

:::

:::info

Please refer to the Score-P manual [here](https://perftools.pages.jsc.fz-juelich.de/cicd/scorep/tags/latest/html/measurement.html#filtering) for a detailed description of the filter file format, how to filter based on file names, define (and combine) blacklists and whitelists, and how to use wildcards for convenience.

:::

The effectiveness of this filter can be examined by scoring the initial summary report again, this time specifying the filter file using the `-f` option of the command:

```bash
$ scorep-score -r -f ../config/scorep.filt scorep_bt-mz_sum/profile.cubex
```

This way a filter file can be incrementally developed, avoiding the need to conduct many measurements to step-by-step investigate the effect of filtering individual functions.

The output of the aforementioned command will look like this:  
```
Estimated aggregate size of event trace:                   661MB
Estimated requirements for largest trace buffer (max_buf): 83MB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       95MB
(hint: When tracing set SCOREP_TOTAL_MEMORY=95MB to avoid intermediate flushes
 or reduce requirements using USR regions filters.)

flt     type     max_buf[B]        visits time[s] time[%] time/visit[us]  region
 -       ALL 21,518,477,721 6,591,910,449 2290.22   100.0           0.35  ALL
 -       USR 21,431,996,118 6,574,793,529  933.34    40.8           0.14  USR
 -       OMP     83,841,856    16,359,424 1342.77    58.6          82.08  OMP
 -       COM      2,351,570       723,560    2.61     0.1           3.60  COM
 -       MPI        288,136        33,928   11.50     0.5         339.05  MPI
 -    SCOREP             41             8    0.00     0.0          82.14  SCOREP

 *       ALL     86,513,609    17,126,761 1356.89    59.2          79.23  ALL-FLT
 +       FLT 21,431,964,112 6,574,783,688  933.33    40.8           0.14  FLT
 -       OMP     83,841,856    16,359,424 1342.77    58.6          82.08  OMP-FLT
 *       COM      2,351,570       723,560    2.61     0.1           3.60  COM-FLT
 -       MPI        288,136        33,928   11.50     0.5         339.05  MPI-FLT
 *       USR         32,006         9,841    0.01     0.0           0.57  USR-FLT
 -    SCOREP             41             8    0.00     0.0          82.14  SCOREP-FLT

 +       USR  6,883,222,086 2,110,313,472  389.24    17.0           0.18  binvcrhs
 +       USR  6,883,222,086 2,110,313,472  296.09    12.9           0.14  matmul_sub
 +       USR  6,883,222,086 2,110,313,472  218.40     9.5           0.10  matvec_sub
 +       USR    293,617,584    87,475,200   12.77     0.6           0.15  lhsinit
 +       USR    293,617,584    87,475,200   10.24     0.4           0.12  binvrhs
 +       USR    224,028,792    68,892,672    6.60     0.3           0.10  exact_solution
 -       OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:204
 -       OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:215
 -       OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:244
 -       OMP      6,715,008       617,472    0.15     0.0           0.24  !$omp parallel @exch_qbc.f:255
 -       OMP      3,374,208       310,272    0.74     0.0           2.38  !$omp parallel @rhs.f:28
 -       OMP      3,357,504       308,736    0.08     0.0           0.25  !$omp parallel @add.f:22
 -       OMP      3,357,504       308,736    0.12     0.0           0.39  !$omp parallel @z_solve.f:43
 -       OMP      3,357,504       308,736    0.12     0.0           0.39  !$omp parallel @y_solve.f:43
 -       OMP      3,357,504       308,736    0.13     0.0           0.41  !$omp parallel @x_solve.f:46
 -       OMP      2,006,784       617,472    0.93     0.0           1.51  !$omp do @exch_qbc.f:204
 -       OMP      2,006,784       617,472    0.71     0.0           1.15  !$omp implicit barrier @exch_qbc.f:213
 -       OMP      2,006,784       617,472    1.18     0.1           1.91  !$omp do @exch_qbc.f:215
 -       OMP      2,006,784       617,472    0.72     0.0           1.17  !$omp implicit barrier @exch_qbc.f:224
 -       OMP      2,006,784       617,472    0.86     0.0           1.39  !$omp do @exch_qbc.f:244
 -       OMP      2,006,784       617,472    0.73     0.0           1.18  !$omp implicit barrier @exch_qbc.f:253
 -       OMP      2,006,784       617,472    1.26     0.1           2.04  !$omp do @exch_qbc.f:255
 -       OMP      2,006,784       617,472    0.72     0.0           1.16  !$omp implicit barrier @exch_qbc.f:264
 -       OMP      1,008,384       310,272    1.16     0.1           3.75  !$omp implicit barrier @rhs.f:439
 -       OMP      1,008,384       310,272   12.81     0.6          41.29  !$omp do @rhs.f:37
 -       OMP      1,008,384       310,272    7.02     0.3          22.63  !$omp do @rhs.f:62
 -       OMP      1,008,384       310,272    5.27     0.2          16.99  !$omp implicit barrier @rhs.f:72
 -       OMP      1,008,384       310,272   16.51     0.7          53.20  !$omp do @rhs.f:80
 -       OMP      1,008,384       310,272   15.48     0.7          49.89  !$omp do @rhs.f:191
 -       OMP      1,008,384       310,272   11.03     0.5          35.55  !$omp do @rhs.f:301
 -       OMP      1,008,384       310,272    6.28     0.3          20.22  !$omp implicit barrier @rhs.f:353
 -       OMP      1,008,384       310,272    1.05     0.0           3.39  !$omp do @rhs.f:359
 -       OMP      1,008,384       310,272    0.65     0.0           2.09  !$omp do @rhs.f:372
 -       OMP      1,008,384       310,272    6.47     0.3          20.84  !$omp do @rhs.f:384
 -       OMP      1,008,384       310,272    0.84     0.0           2.70  !$omp do @rhs.f:400
 -       OMP      1,008,384       310,272    0.45     0.0           1.45  !$omp do @rhs.f:413
 -       OMP      1,008,384       310,272    1.70     0.1           5.47  !$omp implicit barrier @rhs.f:423
 -       OMP      1,008,384       310,272    1.99     0.1           6.40  !$omp do @rhs.f:428
 -       OMP      1,003,392       308,736    8.06     0.4          26.12  !$omp do @add.f:22
 -       OMP      1,003,392       308,736    2.17     0.1           7.02  !$omp implicit barrier @add.f:33
 -       OMP      1,003,392       308,736  118.95     5.2         385.27  !$omp implicit barrier @z_solve.f:428
 -       OMP      1,003,392       308,736  282.02    12.3         913.47  !$omp do @z_solve.f:52
 -       OMP      1,003,392       308,736  135.33     5.9         438.33  !$omp implicit barrier @y_solve.f:406
 -       OMP      1,003,392       308,736  284.72    12.4         922.22  !$omp do @y_solve.f:52
 -       OMP      1,003,392       308,736  132.39     5.8         428.82  !$omp implicit barrier @x_solve.f:407
 -       OMP      1,003,392       308,736  271.75    11.9         880.21  !$omp do @x_solve.f:54
 -       COM        668,928       205,824    0.68     0.0           3.33  copy_x_face
 -       COM        668,928       205,824    0.66     0.0           3.23  copy_y_face
 -       COM        168,064        51,712    0.20     0.0           3.79  compute_rhs
 -       OMP        168,064        51,712    0.02     0.0           0.37  !$omp master @rhs.f:74
 -       OMP        168,064        51,712    0.01     0.0           0.20  !$omp master @rhs.f:183
 -       OMP        168,064        51,712    0.01     0.0           0.21  !$omp master @rhs.f:293
 -       OMP        168,064        51,712    0.01     0.0           0.12  !$omp master @rhs.f:424
 -       COM        167,232        51,456    0.09     0.0           1.71  adi
 -       COM        167,232        51,456    0.21     0.0           4.02  x_solve
 -       COM        167,232        51,456    0.20     0.0           3.83  y_solve
 -       COM        167,232        51,456    0.20     0.0           3.81  z_solve
 -       COM        167,232        51,456    0.19     0.0           3.69  add
 -       MPI        125,223        11,256    0.04     0.0           3.46  MPI_Irecv
 -       MPI        125,223        11,256    0.08     0.0           6.95  MPI_Isend
 -       MPI         36,582        11,256    9.68     0.4         859.58  MPI_Waitall
 -       OMP         33,408         3,072    0.00     0.0           1.24  !$omp parallel @initialize.f:28
 -       USR         31,876         9,808    0.00     0.0           0.11  get_comm_index
 -       OMP         24,960         7,680    0.00     0.0           0.11  !$omp atomic @error.f:51
 -       OMP         24,960         7,680    0.00     0.0           0.11  !$omp atomic @error.f:104
 -       OMP         16,704         1,536    0.00     0.0           0.82  !$omp parallel @exact_rhs.f:21
 -       OMP         16,704         1,536    0.00     0.0           1.33  !$omp parallel @error.f:27
 -       OMP         16,704         1,536    0.00     0.0           1.31  !$omp parallel @error.f:86
 -       OMP          9,984         3,072    0.06     0.0          20.64  !$omp implicit barrier @initialize.f:204
 -       OMP          9,984         3,072    0.13     0.0          41.65  !$omp do @initialize.f:31
 -       OMP          9,984         3,072    5.10     0.2        1660.59  !$omp do @initialize.f:50
 -       OMP          9,984         3,072    0.03     0.0           9.45  !$omp do @initialize.f:100
 -       OMP          9,984         3,072    0.03     0.0           9.34  !$omp do @initialize.f:119
 -       OMP          9,984         3,072    0.04     0.0          13.92  !$omp do @initialize.f:137
 -       OMP          9,984         3,072    0.04     0.0          14.12  !$omp do @initialize.f:156
 -       OMP          9,984         3,072    1.59     0.1         517.82  !$omp implicit barrier @initialize.f:167
 -       OMP          9,984         3,072    0.03     0.0           9.93  !$omp do @initialize.f:174
 -       OMP          9,984         3,072    0.03     0.0           9.91  !$omp do @initialize.f:192
 -       COM          5,226         1,608    0.13     0.0          83.03  exch_qbc
 -       OMP          4,992         1,536    0.00     0.0           2.96  !$omp implicit barrier @exact_rhs.f:357
 -       OMP          4,992         1,536    0.14     0.0          92.49  !$omp do @exact_rhs.f:31
 -       OMP          4,992         1,536    0.11     0.0          71.58  !$omp implicit barrier @exact_rhs.f:41
 -       OMP          4,992         1,536    0.43     0.0         281.63  !$omp do @exact_rhs.f:46
 -       OMP          4,992         1,536    0.43     0.0         277.83  !$omp do @exact_rhs.f:147
 -       OMP          4,992         1,536    0.37     0.0         241.57  !$omp implicit barrier @exact_rhs.f:242
 -       OMP          4,992         1,536    0.42     0.0         275.60  !$omp do @exact_rhs.f:247
 -       OMP          4,992         1,536    0.16     0.0         105.84  !$omp implicit barrier @exact_rhs.f:341
 -       OMP          4,992         1,536    0.02     0.0          12.54  !$omp do @exact_rhs.f:346
 -       OMP          4,992         1,536    0.13     0.0          85.93  !$omp implicit barrier @error.f:54
 -       OMP          4,992         1,536    0.43     0.0         278.02  !$omp do @error.f:33
 -       OMP          4,992         1,536    0.00     0.0           1.23  !$omp implicit barrier @error.f:107
 -       OMP          4,992         1,536    0.01     0.0           3.39  !$omp do @error.f:91
 -       COM          1,664           512    0.02     0.0          46.29  initialize
 -       COM            832           256    0.00     0.0           3.21  exact_rhs
 -       COM            832           256    0.00     0.0           4.12  rhs_norm
 -       COM            832           256    0.00     0.0           3.70  error_norm
 -       MPI            612            72    0.01     0.0         190.65  MPI_Bcast
 +       USR            572           176    0.00     0.0           0.20  timer_clear
 -       MPI            204            24    0.01     0.0         444.82  MPI_Reduce
 -       MPI            136            16    0.13     0.0        7954.37  MPI_Barrier
 -       MPI             52            16    0.00     0.0           0.87  MPI_Comm_rank
 -    SCOREP             41             8    0.00     0.0          82.14  bt-mz_C.8
 -       COM             26             8    0.02     0.0        2183.25  bt
 -       USR             26             8    0.00     0.0           0.62  set_constants
 -       USR             26             8    0.00     0.0          14.43  zone_starts
 -       USR             26             8    0.00     0.0           2.94  zone_setup
 -       COM             26             8    0.00     0.0         104.45  verify
 -       USR             26             8    0.00     0.0         535.67  map_zones
 -       COM             26             8    0.00     0.0          43.67  env_setup
 -       COM             26             8    0.00     0.0         579.06  mpi_setup
 -       USR             26             1    0.00     0.0          76.21  print_results
 +       USR             26             8    0.00     0.0           0.36  timer_read
 +       USR             26             8    0.00     0.0          16.62  timer_stop
 +       USR             26             8    0.00     0.0         518.54  timer_start
 -       MPI             26             8    0.00     0.0           4.80  MPI_Comm_size
 -       MPI             26             8    0.00     0.0         129.90  MPI_Comm_split
 -       MPI             26             8    0.01     0.0        1046.21  MPI_Finalize
 -       MPI             26             8    1.55     0.1      193698.22  MPI_Init_thread
```

Below the (original) function group summary, the score report now also includes a second summary with the filter applied. Here, an additional group `FLT` is added, which subsumes all filtered regions. Moreover, the column `flt` indicates whether a region/function group is filtered (`+`), not filtered (`-`), or possibly partially filtered (`∗`, only used for function groups).

As expected, the estimate for the aggregate event trace size drops down to 661MB, and the process-local maximum across all ranks is reduced to 83MB. Since the Score-P measurement system also creates a number of internal data structures (e.g., to track MPI requests and communicators), the suggested setting for the `SCOREP_TOTAL_MEMORY` environment variable to adjust the maximum amount of memory used by the Score-P memory management is 95MB when tracing is configured.

:::

With the `-g` option, `scorep-score` can create an initial filter file in Score-P format. See more details [here](https://perftools.pages.jsc.fz-juelich.de/cicd/scorep/tags/latest/html/score.html). 

:::

Let's modify our batch script `scorep.sbatch.C.8` to enable filtering (see highlighted lines):
```bash showLineNumbers
#!/bin/bash
#SBATCH -J mzmpibt             # job name
#SBATCH -o profile-C.8-%j.out  # stdout output file
#SBATCH -e profile-C.8-%j.err  # stderr output file
#SBATCH --nodes=2              # requested nodes
#SBATCH --ntasks=8             # requested MPI tasks
#SBATCH --ntasks-per-node=4
#SBATCH --cpus-per-task=6      # requested logical CPUs/threads per task
#SBATCH --partition RM         # partition to use
#SBATCH --account=tra210016p   # account to charge
#SBATCH --export=ALL           # export env varibales
#SBATCH --time=00:10:00        # max wallclock time (hh:mm:ss)
##SBATCH --reservation=ihpcssday3RM10

# setup modules, add tools to PATH
set -x
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

module use /jet/home/zhukov/ihpcss24/modules/
module load gcc/10.2.0 openmpi/4.0.5-gcc10.2.0 scalasca/2.6-gcc_openmpi

# benchmark configuration
export NPB_MZ_BLOAD=0
CLASS=C
PROCS=$SLURM_NTASKS
EXE=./bt-mz_$CLASS.$PROCS

# Score-P measurement configuration
# highlight-start
export SCOREP_EXPERIMENT_DIRECTORY=scorep_bt-mz_${CLASS}_${PROCS}x${OMP_NUM_THREADS}_sum_filt
export SCOREP_FILTERING_FILE=../config/scorep.filt
# highlight-end

mpirun -n $SLURM_NTASKS --cpus-per-rank $SLURM_CPUS_PER_TASK $EXE
```
In first highlighted line we added suffix `_filt` to create measurement directory with a different name. In the second one we provided name of the filter file which will be used during the measurement.

:::info

If you do not specify `SCOREP_EXPERIMENT_DIRECTORY` variable, the experiment directory is named in the format `scorep-YYYYMMDD_HHMM_XXXXXXXX`, where `YYYYMMDD` and `HHMM` represent the date and time, followed by random numbers.

If a directory with the specified name already exists, it will be renamed with a date suffix by default. To prevent this and abort the measurement if the directory exists, set `SCOREP_OVERWRITE_EXPERIMENT_DIRECTORY` to `false`. This setting is effective only if `SCOREP_EXPERIMENT_DIRECTORY` is set.

:::

Now we are ready to submit our batch script with enabled filtering
```bash
$ sbatch scorep.sbatch.C.8
```

:::tip[Question]

Open the freshly generated stdout file and find the metric "Time in seconds". Compare it to our baseline measurement [here](./baseline.md) and our original instrumented run [here](./instrumentation.md). Has it increased or decreased? If so, by how much? Which routines in your opinion are safe to filter?

:::