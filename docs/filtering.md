---
sidebar_position: 3
---
# Filtering

Congratulations, we have made our first measurement with Score-P. But how good was the measurement?
The measured execution gave the desired valid result, but the execution took a bit longer than expected! The instrumented run has a large increase in runtime compared to a baseline (around 47s versus 23s). Your runtime may vary slightly from our measurements. Even if we ignore the start and end of the measurement, it was probably prolonged by the instrumentation/measurement overhead.

To make sure you don't draw the wrong conclusions based on data that has been disturbed by significant overhead, it's often a good idea to optimise the measurement configuration before you do any more experiments. There are lots of ways you can do this, for example, by using runtime filtering, selective recording, or manual instrumentation to control the measurement.

However, in many cases, it's enough to filter a few frequently executed but otherwise unimportant user functions to reduce the measurement overhead to an acceptable level (based on experience, we consider 0-20% of runtime dilation as acceptable). The selection of those routines has to be done with care, though, as it affects the granularity of the measurement and too aggressive filtering might "blur" the location of important hotspots.

To understand where the overhead is coming from it is necessary to make scoring of the measurement. It can be done via the following command:
```bash
$ scorep-score scorep_bt-mz_sum/profile.cubex 
```

As an output you will see the following:
```
Estimated aggregate size of event trace:                   40GB
Estimated requirements for largest trace buffer (max_buf): 6GB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       6GB
(warning: The memory requirements cannot be satisfied by Score-P to avoid
 intermediate flushes when tracing. Set SCOREP_TOTAL_MEMORY=4G to get the
 maximum supported memory or reduce requirements using USR regions filters.)

flt     type    max_buf[B]        visits time[s] time[%] time/visit[us]  region
         ALL 5,398,866,521 1,638,135,715 2570.45   100.0           1.57  ALL
         USR 5,358,738,138 1,631,138,913  161.17     6.3           0.10  USR
         OMP    39,174,822     6,781,952 2093.27    81.4         308.65  OMP
         COM       665,210       182,120  302.72    11.8        1662.21  COM
         MPI       288,310        32,722   13.28     0.5         405.86  MPI
      SCOREP            41             8    0.00     0.0          43.30  SCOREP
```

As can be seen from the top of the score output, the estimated size for an event trace measurement without filtering applied is approximately 40GB, with the process-local maximum across all ranks being roughly 6GB.

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
$ scorep-score -r scorep_bt-mz_sum/profile.cubex
```
As an output you will see the following
```bash
Estimated aggregate size of event trace:                   40GB
Estimated requirements for largest trace buffer (max_buf): 6GB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       6GB
(warning: The memory requirements cannot be satisfied by Score-P to avoid
 intermediate flushes when tracing. Set SCOREP_TOTAL_MEMORY=4G to get the
 maximum supported memory or reduce requirements using USR regions filters.)

flt     type    max_buf[B]        visits time[s] time[%] time/visit[us]  region
         ALL 5,398,866,521 1,638,135,715 2570.45   100.0           1.57  ALL
         USR 5,358,738,138 1,631,138,913  161.17     6.3           0.10  USR
         OMP    39,174,822     6,781,952 2093.27    81.4         308.65  OMP
         COM       665,210       182,120  302.72    11.8        1662.21  COM
         MPI       288,310        32,722   13.28     0.5         405.86  MPI
      SCOREP            41             8    0.00     0.0          43.30  SCOREP
# highlight-start
         USR 1,716,505,830   522,844,416   70.49     2.7           0.13  binvcrhs
         USR 1,716,505,830   522,844,416   54.37     2.1           0.10  matmul_sub
         USR 1,716,505,830   522,844,416   30.05     1.2           0.06  matvec_sub
         USR    76,195,080    22,692,096    2.97     0.1           0.13  lhsinit
         USR    76,195,080    22,692,096    2.00     0.1           0.09  binvrhs
         USR    56,825,184    17,219,840    1.28     0.0           0.07  exact_solution
# highlight-end
         OMP     3,147,660       257,280    0.03     0.0           0.13  !$omp parallel @exch_qbc.f:204
         OMP     3,147,660       257,280    0.04     0.0           0.14  !$omp parallel @exch_qbc.f:215
         OMP     3,147,660       257,280    0.04     0.0           0.14  !$omp parallel @exch_qbc.f:244
         OMP     3,147,660       257,280    0.04     0.0           0.15  !$omp parallel @exch_qbc.f:255
         OMP     1,581,660       129,280    0.14     0.0           1.08  !$omp parallel @rhs.f:28
         OMP     1,573,830       128,640    0.02     0.0           0.17  !$omp parallel @add.f:22
         OMP     1,573,830       128,640    0.04     0.0           0.32  !$omp parallel @z_solve.f:43
         OMP     1,573,830       128,640    0.04     0.0           0.32  !$omp parallel @y_solve.f:43
         OMP     1,573,830       128,640    0.04     0.0           0.32  !$omp parallel @x_solve.f:46
         OMP       940,680       257,280    0.13     0.0           0.49  !$omp do @exch_qbc.f:204
         OMP       940,680       257,280   17.03     0.7          66.20  !$omp implicit barrier @exch_qbc.f:213
         OMP       940,680       257,280    0.14     0.0           0.56  !$omp do @exch_qbc.f:215
         OMP       940,680       257,280   17.09     0.7          66.41  !$omp implicit barrier @exch_qbc.f:224
         OMP       940,680       257,280    0.18     0.0           0.70  !$omp do @exch_qbc.f:244
         OMP       940,680       257,280   17.42     0.7          67.73  !$omp implicit barrier @exch_qbc.f:253
         OMP       940,680       257,280    0.18     0.0           0.70  !$omp do @exch_qbc.f:255
         OMP       940,680       257,280   17.33     0.7          67.34  !$omp implicit barrier @exch_qbc.f:264
         OMP       472,680       129,280   10.97     0.4          84.86  !$omp implicit barrier @rhs.f:439
         OMP       472,680       129,280    1.92     0.1          14.86  !$omp do @rhs.f:37
         OMP       472,680       129,280    1.61     0.1          12.46  !$omp do @rhs.f:62
         OMP       472,680       129,280   71.47     2.8         552.80  !$omp implicit barrier @rhs.f:72
         OMP       472,680       129,280    4.55     0.2          35.20  !$omp do @rhs.f:80
         OMP       472,680       129,280    4.31     0.2          33.37  !$omp do @rhs.f:191
         OMP       472,680       129,280    2.90     0.1          22.43  !$omp do @rhs.f:301
         OMP       472,680       129,280   77.15     3.0         596.76  !$omp implicit barrier @rhs.f:353
         OMP       472,680       129,280    0.11     0.0           0.85  !$omp do @rhs.f:359
         OMP       472,680       129,280    0.11     0.0           0.82  !$omp do @rhs.f:372
         OMP       472,680       129,280    1.25     0.0           9.66  !$omp do @rhs.f:384
         OMP       472,680       129,280    0.13     0.0           0.97  !$omp do @rhs.f:400
         OMP       472,680       129,280    0.11     0.0           0.87  !$omp do @rhs.f:413
         OMP       472,680       129,280   18.53     0.7         143.36  !$omp implicit barrier @rhs.f:423
         OMP       472,680       129,280    0.49     0.0           3.81  !$omp do @rhs.f:428
         OMP       470,340       128,640    0.52     0.0           4.06  !$omp do @add.f:22
         OMP       470,340       128,640   11.15     0.4          86.69  !$omp implicit barrier @add.f:33
         OMP       470,340       128,640  520.36    20.2        4045.09  !$omp implicit barrier @z_solve.f:428
         OMP       470,340       128,640   54.58     2.1         424.27  !$omp do @z_solve.f:52
         OMP       470,340       128,640  570.18    22.2        4432.34  !$omp implicit barrier @y_solve.f:406
         OMP       470,340       128,640   54.71     2.1         425.33  !$omp do @y_solve.f:52
         OMP       470,340       128,640  549.55    21.4        4272.04  !$omp implicit barrier @x_solve.f:407
         OMP       470,340       128,640   52.68     2.0         409.55  !$omp do @x_solve.f:54
         COM       188,136        51,456    6.79     0.3         132.04  copy_x_face
         COM       188,136        51,456    6.67     0.3         129.69  copy_y_face
         MPI       125,223        10,854    0.03     0.0           3.06  MPI_Irecv
         MPI       125,223        10,854    0.19     0.0          17.89  MPI_Isend
         COM        47,268        12,928    4.80     0.2         371.56  compute_rhs
         OMP        47,268        12,928    0.00     0.0           0.29  !$omp master @rhs.f:74
         OMP        47,268        12,928    0.00     0.0           0.18  !$omp master @rhs.f:183
         OMP        47,268        12,928    0.00     0.0           0.15  !$omp master @rhs.f:293
         OMP        47,268        12,928    0.00     0.0           0.17  !$omp master @rhs.f:424
         COM        47,034        12,864    0.01     0.0           0.85  adi
         COM        47,034        12,864   90.92     3.5        7067.81  x_solve
         COM        47,034        12,864   93.53     3.6        7270.87  y_solve
         COM        47,034        12,864   97.01     3.8        7541.13  z_solve
         COM        47,034        12,864    2.08     0.1         161.46  add
         MPI        36,582        10,854   10.30     0.4         948.63  MPI_Waitall
         OMP        15,660         1,280    0.00     0.0           0.79  !$omp parallel @initialize.f:28
         OMP        11,700         3,200    0.00     0.0           0.07  !$omp atomic @error.f:51
         OMP        11,700         3,200    0.00     0.0           0.07  !$omp atomic @error.f:104
         OMP         7,830           640    0.00     0.0           0.51  !$omp parallel @exact_rhs.f:21
         OMP         7,830           640    0.00     0.0           0.74  !$omp parallel @error.f:27
         OMP         7,830           640    0.00     0.0           0.57  !$omp parallel @error.f:86
         COM         5,226         1,608    0.02     0.0          15.22  exch_qbc
         OMP         4,680         1,280    0.22     0.0         175.51  !$omp implicit barrier @initialize.f:204
         OMP         4,680         1,280    0.02     0.0          17.03  !$omp do @initialize.f:31
         OMP         4,680         1,280    0.92     0.0         719.67  !$omp do @initialize.f:50
         OMP         4,680         1,280    0.00     0.0           2.76  !$omp do @initialize.f:100
         OMP         4,680         1,280    0.00     0.0           2.79  !$omp do @initialize.f:119
         OMP         4,680         1,280    0.01     0.0           3.99  !$omp do @initialize.f:137
         OMP         4,680         1,280    0.01     0.0           4.08  !$omp do @initialize.f:156
         OMP         4,680         1,280    7.97     0.3        6227.90  !$omp implicit barrier @initialize.f:167
         OMP         4,680         1,280    0.01     0.0           6.11  !$omp do @initialize.f:174
         OMP         4,680         1,280    0.01     0.0           6.02  !$omp do @initialize.f:192
         USR         4,550         1,400    0.00     0.0           0.06  get_comm_index
         OMP         2,340           640    0.05     0.0          73.19  !$omp implicit barrier @exact_rhs.f:357
         OMP         2,340           640    0.01     0.0          22.36  !$omp do @exact_rhs.f:31
         OMP         2,340           640    1.10     0.0        1711.99  !$omp implicit barrier @exact_rhs.f:41
         OMP         2,340           640    0.08     0.0         119.53  !$omp do @exact_rhs.f:46
         OMP         2,340           640    0.07     0.0         111.99  !$omp do @exact_rhs.f:147
         OMP         2,340           640    1.92     0.1        2998.85  !$omp implicit barrier @exact_rhs.f:242
         OMP         2,340           640    0.08     0.0         118.56  !$omp do @exact_rhs.f:247
         OMP         2,340           640    0.67     0.0        1049.28  !$omp implicit barrier @exact_rhs.f:341
         OMP         2,340           640    0.00     0.0           1.85  !$omp do @exact_rhs.f:346
         OMP         2,340           640    0.72     0.0        1123.30  !$omp implicit barrier @error.f:54
         OMP         2,340           640    0.06     0.0         101.38  !$omp do @error.f:33
         OMP         2,340           640    0.05     0.0          78.05  !$omp implicit barrier @error.f:107
         OMP         2,340           640    0.00     0.0           2.06  !$omp do @error.f:91
         MPI           612            72    0.00     0.0          32.94  MPI_Bcast
         USR           572           176    0.00     0.0           0.10  timer_clear
         COM           468           128    0.73     0.0        5685.34  initialize
         COM           234            64    0.01     0.0         137.02  exact_rhs
         COM           234            64    0.01     0.0         151.69  rhs_norm
         COM           234            64    0.13     0.0        1977.62  error_norm
         MPI           204            24    0.01     0.0         386.08  MPI_Reduce
         MPI           136            16    0.10     0.0        6541.62  MPI_Barrier
         MPI            84             8    0.00     0.0         214.85  MPI_Comm_split
         MPI            84             8    0.00     0.0          36.30  MPI_Finalize
         MPI            84             8    2.64     0.1      329806.37  MPI_Init_thread
         MPI            52            16    0.00     0.0           0.54  MPI_Comm_rank
      SCOREP            41             8    0.00     0.0          43.30  bt-mz_B.8
         COM            26             8    0.00     0.0         417.57  bt
         USR            26             8    0.00     0.0           0.34  set_constants
         USR            26             8    0.00     0.0           3.65  zone_starts
         USR            26             8    0.00     0.0           1.13  zone_setup
         COM            26             8    0.00     0.0          44.15  verify
         USR            26             8    0.00     0.0          27.10  map_zones
         COM            26             8    0.00     0.0          17.88  env_setup
         COM            26             8    0.00     0.0          28.33  mpi_setup
         USR            26             1    0.00     0.0          63.97  print_results
         USR            26             8    0.00     0.0           0.28  timer_read
         USR            26             8    0.00     0.0          13.27  timer_stop
         USR            26             8    0.00     0.0          12.07  timer_start
         MPI            26             8    0.00     0.0           2.83  MPI_Comm_size
```

The detailed breakdown by region below the summary provides a classification according to these function groups (column type) for each region found in the summary report. Investigation of this part of the score report reveals that most of the trace data would be generated by about 1.7 billion calls to each of the three routines `binvcrhs`, `matmul_sub` and `matvec_sub` (these routines are highlighted), which are classified as `USR`. And although the percentage of time spent in these routines at first glance suggest that they are important, the average time per visit is below 130 nanoseconds (column `time/visit`). That is, the relative measurement overhead for these functions is substantial, and thus a significant amount of the reported time is very likely spent in the Score-P measurement system rather than in the application itself. Therefore, these routines constitute good candidates for being filtered (like they are good candidates for being inlined by the compiler). Additionally selecting the `lhsinit`, `binvrhs`, and `exact_solution` routines, which generates about 208MB of event data on a single rank with very little runtime impact.

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
Estimated aggregate size of event trace:                   273MB
Estimated requirements for largest trace buffer (max_buf): 39MB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       59MB
(hint: When tracing set SCOREP_TOTAL_MEMORY=59MB to avoid intermediate flushes
 or reduce requirements using USR regions filters.)

flt     type    max_buf[B]        visits time[s] time[%] time/visit[us]  region
 -       ALL 5,398,866,521 1,638,135,715 2570.45   100.0           1.57  ALL
 -       USR 5,358,738,138 1,631,138,913  161.17     6.3           0.10  USR
 -       OMP    39,174,822     6,781,952 2093.27    81.4         308.65  OMP
 -       COM       665,210       182,120  302.72    11.8        1662.21  COM
 -       MPI       288,310        32,722   13.28     0.5         405.86  MPI
 -    SCOREP            41             8    0.00     0.0          43.30  SCOREP

 *       ALL    40,133,037     6,998,235 2409.28    93.7         344.27  ALL-FLT
 +       FLT 5,358,733,484 1,631,137,480  161.17     6.3           0.10  FLT
 -       OMP    39,174,822     6,781,952 2093.27    81.4         308.65  OMP-FLT
 *       COM       665,210       182,120  302.72    11.8        1662.21  COM-FLT
 -       MPI       288,310        32,722   13.28     0.5         405.86  MPI-FLT
 *       USR         4,680         1,433    0.00     0.0           0.29  USR-FLT
 -    SCOREP            41             8    0.00     0.0          43.30  SCOREP-FLT

 +       USR 1,716,505,830   522,844,416   70.49     2.7           0.13  binvcrhs
 +       USR 1,716,505,830   522,844,416   54.37     2.1           0.10  matmul_sub
 +       USR 1,716,505,830   522,844,416   30.05     1.2           0.06  matvec_sub
 +       USR    76,195,080    22,692,096    2.97     0.1           0.13  lhsinit
 +       USR    76,195,080    22,692,096    2.00     0.1           0.09  binvrhs
 +       USR    56,825,184    17,219,840    1.28     0.0           0.07  exact_solution
 -       OMP     3,147,660       257,280    0.03     0.0           0.13  !$omp parallel @exch_qbc.f:204
 -       OMP     3,147,660       257,280    0.04     0.0           0.14  !$omp parallel @exch_qbc.f:215
 -       OMP     3,147,660       257,280    0.04     0.0           0.14  !$omp parallel @exch_qbc.f:244
 -       OMP     3,147,660       257,280    0.04     0.0           0.15  !$omp parallel @exch_qbc.f:255
 -       OMP     1,581,660       129,280    0.14     0.0           1.08  !$omp parallel @rhs.f:28
 -       OMP     1,573,830       128,640    0.02     0.0           0.17  !$omp parallel @add.f:22
 -       OMP     1,573,830       128,640    0.04     0.0           0.32  !$omp parallel @z_solve.f:43
 -       OMP     1,573,830       128,640    0.04     0.0           0.32  !$omp parallel @y_solve.f:43
 -       OMP     1,573,830       128,640    0.04     0.0           0.32  !$omp parallel @x_solve.f:46
 -       OMP       940,680       257,280    0.13     0.0           0.49  !$omp do @exch_qbc.f:204
 -       OMP       940,680       257,280   17.03     0.7          66.20  !$omp implicit barrier @exch_qbc.f:213
 -       OMP       940,680       257,280    0.14     0.0           0.56  !$omp do @exch_qbc.f:215
 -       OMP       940,680       257,280   17.09     0.7          66.41  !$omp implicit barrier @exch_qbc.f:224
 -       OMP       940,680       257,280    0.18     0.0           0.70  !$omp do @exch_qbc.f:244
 -       OMP       940,680       257,280   17.42     0.7          67.73  !$omp implicit barrier @exch_qbc.f:253
 -       OMP       940,680       257,280    0.18     0.0           0.70  !$omp do @exch_qbc.f:255
 -       OMP       940,680       257,280   17.33     0.7          67.34  !$omp implicit barrier @exch_qbc.f:264
 -       OMP       472,680       129,280   10.97     0.4          84.86  !$omp implicit barrier @rhs.f:439
 -       OMP       472,680       129,280    1.92     0.1          14.86  !$omp do @rhs.f:37
 -       OMP       472,680       129,280    1.61     0.1          12.46  !$omp do @rhs.f:62
 -       OMP       472,680       129,280   71.47     2.8         552.80  !$omp implicit barrier @rhs.f:72
 -       OMP       472,680       129,280    4.55     0.2          35.20  !$omp do @rhs.f:80
 -       OMP       472,680       129,280    4.31     0.2          33.37  !$omp do @rhs.f:191
 -       OMP       472,680       129,280    2.90     0.1          22.43  !$omp do @rhs.f:301
 -       OMP       472,680       129,280   77.15     3.0         596.76  !$omp implicit barrier @rhs.f:353
 -       OMP       472,680       129,280    0.11     0.0           0.85  !$omp do @rhs.f:359
 -       OMP       472,680       129,280    0.11     0.0           0.82  !$omp do @rhs.f:372
 -       OMP       472,680       129,280    1.25     0.0           9.66  !$omp do @rhs.f:384
 -       OMP       472,680       129,280    0.13     0.0           0.97  !$omp do @rhs.f:400
 -       OMP       472,680       129,280    0.11     0.0           0.87  !$omp do @rhs.f:413
 -       OMP       472,680       129,280   18.53     0.7         143.36  !$omp implicit barrier @rhs.f:423
 -       OMP       472,680       129,280    0.49     0.0           3.81  !$omp do @rhs.f:428
 -       OMP       470,340       128,640    0.52     0.0           4.06  !$omp do @add.f:22
 -       OMP       470,340       128,640   11.15     0.4          86.69  !$omp implicit barrier @add.f:33
 -       OMP       470,340       128,640  520.36    20.2        4045.09  !$omp implicit barrier @z_solve.f:428
 -       OMP       470,340       128,640   54.58     2.1         424.27  !$omp do @z_solve.f:52
 -       OMP       470,340       128,640  570.18    22.2        4432.34  !$omp implicit barrier @y_solve.f:406
 -       OMP       470,340       128,640   54.71     2.1         425.33  !$omp do @y_solve.f:52
 -       OMP       470,340       128,640  549.55    21.4        4272.04  !$omp implicit barrier @x_solve.f:407
 -       OMP       470,340       128,640   52.68     2.0         409.55  !$omp do @x_solve.f:54
 -       COM       188,136        51,456    6.79     0.3         132.04  copy_x_face
 -       COM       188,136        51,456    6.67     0.3         129.69  copy_y_face
 -       MPI       125,223        10,854    0.03     0.0           3.06  MPI_Irecv
 -       MPI       125,223        10,854    0.19     0.0          17.89  MPI_Isend
 -       COM        47,268        12,928    4.80     0.2         371.56  compute_rhs
 -       OMP        47,268        12,928    0.00     0.0           0.29  !$omp master @rhs.f:74
 -       OMP        47,268        12,928    0.00     0.0           0.18  !$omp master @rhs.f:183
 -       OMP        47,268        12,928    0.00     0.0           0.15  !$omp master @rhs.f:293
 -       OMP        47,268        12,928    0.00     0.0           0.17  !$omp master @rhs.f:424
 -       COM        47,034        12,864    0.01     0.0           0.85  adi
 -       COM        47,034        12,864   90.92     3.5        7067.81  x_solve
 -       COM        47,034        12,864   93.53     3.6        7270.87  y_solve
 -       COM        47,034        12,864   97.01     3.8        7541.13  z_solve
 -       COM        47,034        12,864    2.08     0.1         161.46  add
 -       MPI        36,582        10,854   10.30     0.4         948.63  MPI_Waitall
 -       OMP        15,660         1,280    0.00     0.0           0.79  !$omp parallel @initialize.f:28
 -       OMP        11,700         3,200    0.00     0.0           0.07  !$omp atomic @error.f:51
 -       OMP        11,700         3,200    0.00     0.0           0.07  !$omp atomic @error.f:104
 -       OMP         7,830           640    0.00     0.0           0.51  !$omp parallel @exact_rhs.f:21
 -       OMP         7,830           640    0.00     0.0           0.74  !$omp parallel @error.f:27
 -       OMP         7,830           640    0.00     0.0           0.57  !$omp parallel @error.f:86
 -       COM         5,226         1,608    0.02     0.0          15.22  exch_qbc
 -       OMP         4,680         1,280    0.22     0.0         175.51  !$omp implicit barrier @initialize.f:204
 -       OMP         4,680         1,280    0.02     0.0          17.03  !$omp do @initialize.f:31
 -       OMP         4,680         1,280    0.92     0.0         719.67  !$omp do @initialize.f:50
 -       OMP         4,680         1,280    0.00     0.0           2.76  !$omp do @initialize.f:100
 -       OMP         4,680         1,280    0.00     0.0           2.79  !$omp do @initialize.f:119
 -       OMP         4,680         1,280    0.01     0.0           3.99  !$omp do @initialize.f:137
 -       OMP         4,680         1,280    0.01     0.0           4.08  !$omp do @initialize.f:156
 -       OMP         4,680         1,280    7.97     0.3        6227.90  !$omp implicit barrier @initialize.f:167
 -       OMP         4,680         1,280    0.01     0.0           6.11  !$omp do @initialize.f:174
 -       OMP         4,680         1,280    0.01     0.0           6.02  !$omp do @initialize.f:192
 -       USR         4,550         1,400    0.00     0.0           0.06  get_comm_index
 -       OMP         2,340           640    0.05     0.0          73.19  !$omp implicit barrier @exact_rhs.f:357
 -       OMP         2,340           640    0.01     0.0          22.36  !$omp do @exact_rhs.f:31
 -       OMP         2,340           640    1.10     0.0        1711.99  !$omp implicit barrier @exact_rhs.f:41
 -       OMP         2,340           640    0.08     0.0         119.53  !$omp do @exact_rhs.f:46
 -       OMP         2,340           640    0.07     0.0         111.99  !$omp do @exact_rhs.f:147
 -       OMP         2,340           640    1.92     0.1        2998.85  !$omp implicit barrier @exact_rhs.f:242
 -       OMP         2,340           640    0.08     0.0         118.56  !$omp do @exact_rhs.f:247
 -       OMP         2,340           640    0.67     0.0        1049.28  !$omp implicit barrier @exact_rhs.f:341
 -       OMP         2,340           640    0.00     0.0           1.85  !$omp do @exact_rhs.f:346
 -       OMP         2,340           640    0.72     0.0        1123.30  !$omp implicit barrier @error.f:54
 -       OMP         2,340           640    0.06     0.0         101.38  !$omp do @error.f:33
 -       OMP         2,340           640    0.05     0.0          78.05  !$omp implicit barrier @error.f:107
 -       OMP         2,340           640    0.00     0.0           2.06  !$omp do @error.f:91
 -       MPI           612            72    0.00     0.0          32.94  MPI_Bcast
 +       USR           572           176    0.00     0.0           0.10  timer_clear
 -       COM           468           128    0.73     0.0        5685.34  initialize
 -       COM           234            64    0.01     0.0         137.02  exact_rhs
 -       COM           234            64    0.01     0.0         151.69  rhs_norm
 -       COM           234            64    0.13     0.0        1977.62  error_norm
 -       MPI           204            24    0.01     0.0         386.08  MPI_Reduce
 -       MPI           136            16    0.10     0.0        6541.62  MPI_Barrier
 -       MPI            84             8    0.00     0.0         214.85  MPI_Comm_split
 -       MPI            84             8    0.00     0.0          36.30  MPI_Finalize
 -       MPI            84             8    2.64     0.1      329806.37  MPI_Init_thread
 -       MPI            52            16    0.00     0.0           0.54  MPI_Comm_rank
 -    SCOREP            41             8    0.00     0.0          43.30  bt-mz_B.8
 -       COM            26             8    0.00     0.0         417.57  bt
 -       USR            26             8    0.00     0.0           0.34  set_constants
 -       USR            26             8    0.00     0.0           3.65  zone_starts
 -       USR            26             8    0.00     0.0           1.13  zone_setup
 -       COM            26             8    0.00     0.0          44.15  verify
 -       USR            26             8    0.00     0.0          27.10  map_zones
 -       COM            26             8    0.00     0.0          17.88  env_setup
 -       COM            26             8    0.00     0.0          28.33  mpi_setup
 -       USR            26             1    0.00     0.0          63.97  print_results
 +       USR            26             8    0.00     0.0           0.28  timer_read
 +       USR            26             8    0.00     0.0          13.27  timer_stop
 +       USR            26             8    0.00     0.0          12.07  timer_start
 -       MPI            26             8    0.00     0.0           2.83  MPI_Comm_size
```

Below the (original) function group summary, the score report now also includes a second summary with the filter applied. Here, an additional group `FLT` is added, which subsumes all filtered regions. Moreover, the column `flt` indicates whether a region/function group is filtered (`+`), not filtered (`-`), or possibly partially filtered (`∗`, only used for function groups).

As expected, the estimate for the aggregate event trace size drops down to 273MB, and the process-local maximum across all ranks is reduced to 39MB. Since the Score-P measurement system also creates a number of internal data structures (e.g., to track MPI requests and communicators), the suggested setting for the `SCOREP_TOTAL_MEMORY` environment variable to adjust the maximum amount of memory used by the Score-P memory management is 59MB when tracing is configured.

:::

With the `-g` option, `scorep-score` can create an initial filter file in Score-P format. See more details [here](https://perftools.pages.jsc.fz-juelich.de/cicd/scorep/tags/latest/html/score.html). 

:::

Let's modify our batch script `scorep.pbs` to enable filtering (see highlighted lines):
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
export SCOREP_EXPERIMENT_DIRECTORY=scorep_bt-mz_sum_sum
export SCOREP_FILTERING_FILE=../config/scorep.filt
# highlight-end
#export SCOREP_METRIC_PAPI=PAPI_TOT_INS,PAPI_TOT_CYC
#export SCOREP_TOTAL_MEMORY=90M
#export SCOREP_ENABLE_TRACING=true

# Run the application
mpirun --report-bindings $EXE
```
In first highlighted line we added suffix `_filt` to create measurement directory with a different name. In the second one we provided name of the filter file which will be used during the measurement.

:::info

If you do not specify `SCOREP_EXPERIMENT_DIRECTORY` variable, the experiment directory is named in the format `scorep-YYYYMMDD_HHMM_XXXXXXXX`, where `YYYYMMDD` and `HHMM` represent the date and time, followed by random numbers.

If a directory with the specified name already exists, it will be renamed with a date suffix by default. To prevent this and abort the measurement if the directory exists, set `SCOREP_OVERWRITE_EXPERIMENT_DIRECTORY` to `false`. This setting is effective only if `SCOREP_EXPERIMENT_DIRECTORY` is set.

:::

Now we are ready to submit our batch script with enabled filtering
```bash
$ pbs scorep.pbs
```

:::tip[Question]

Open the freshly generated stdout file and find the metric "Time in seconds". Compare it to our baseline measurement [here](./baseline.md) and our original instrumented run [here](./instrumentation.md). Has it increased or decreased? If so, by how much? Which routines in your opinion are safe to filter?

:::
