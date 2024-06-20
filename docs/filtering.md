---
sidebar_position: 3
---
# Filtering

Congratulations, we have made our first measurement with Score-P. But how good was the measurement?
The measured execution gave the desired valid result, but the execution took a bit longer than expected! The instrumented run has a large increase in runtime compared to a baseline (around 46s versus 14s). Your runtime may vary slightly from our measurements. Even if we ignore the start and end of the measurement, it was probably prolonged by the instrumentation/measurement overhead.

To make sure you don't draw the wrong conclusions based on data that has been disturbed by significant overhead, it's often a good idea to optimise the measurement configuration before you do any more experiments. There are lots of ways you can do this, for example, by using runtime filtering, selective recording, or manual instrumentation to control the measurement.

However, in many cases, it's enough to filter a few frequently executed but otherwise unimportant user functions to reduce the measurement overhead to an acceptable level (based on experience, we consider 0-20% of runtime dilation as acceptable). The selection of those routines has to be done with care, though, as it affects the granularity of the measurement and too aggressive filtering might "blur" the location of important hotspots.

To understand where the overhead is coming from it is necessary to make scoring of the measurement. It can be done via the following command:
```bash
$ scorep-score scorep_bt-mz_sum/profile.cubex 
```

As an output you will see the following:
```
Estimated aggregate size of event trace:                   160GB
Estimated requirements for largest trace buffer (max_buf): 6GB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       6GB
(warning: The memory requirements cannot be satisfied by Score-P to avoid
 intermediate flushes when tracing. Set SCOREP_TOTAL_MEMORY=4G to get the
 maximum supported memory or reduce requirements using USR regions filters.)

flt     type    max_buf[B]        visits time[s] time[%] time/visit[us]  region
         ALL 6,282,548,755 6,586,867,463 5044.19   100.0           0.77  ALL
         USR 6,265,237,940 6,574,825,097 2257.25    44.7           0.34  USR
         OMP    17,537,080    10,975,232 2602.86    51.6         237.16  OMP
         MPI       985,204       339,446  180.12     3.6         530.62  MPI
         COM       738,530       727,660    3.93     0.1           5.41  COM
      SCOREP            41            28    0.03     0.0         934.60  SCOREP
```

As can be seen from the top of the score output, the estimated size for an event trace measurement without filtering applied is approximately 160GB, with the process-local maximum across all ranks being roughly 6GB.

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
Estimated aggregate size of event trace:                   160GB
Estimated requirements for largest trace buffer (max_buf): 6GB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       6GB
(warning: The memory requirements cannot be satisfied by Score-P to avoid
 intermediate flushes when tracing. Set SCOREP_TOTAL_MEMORY=4G to get the
 maximum supported memory or reduce requirements using USR regions filters.)

flt     type    max_buf[B]        visits time[s] time[%] time/visit[us]  region
         ALL 6,282,548,755 6,586,867,463 5044.19   100.0           0.77  ALL
         USR 6,265,237,940 6,574,825,097 2257.25    44.7           0.34  USR
         OMP    17,537,080    10,975,232 2602.86    51.6         237.16  OMP
         MPI       985,204       339,446  180.12     3.6         530.62  MPI
         COM       738,530       727,660    3.93     0.1           5.41  COM
      SCOREP            41            28    0.03     0.0         934.60  SCOREP

# highlight-start
         USR 2,014,873,848 2,110,313,472  913.03    18.1           0.43  binvcrhs_
         USR 2,014,873,848 2,110,313,472  553.30    11.0           0.26  matvec_sub_
         USR 2,014,873,848 2,110,313,472  718.20    14.2           0.34  matmul_sub_
         USR    88,951,746    87,475,200   31.80     0.6           0.36  lhsinit_
         USR    88,951,746    87,475,200   24.24     0.5           0.28  binvrhs_
         USR    64,926,576    68,892,672   16.66     0.3           0.24  exact_solution_
# highlight-end
         OMP     1,398,960       411,648    0.18     0.0           0.43  !$omp parallel @exch_qbc.f:204
         OMP     1,398,960       411,648    0.18     0.0           0.44  !$omp parallel @exch_qbc.f:215
         OMP     1,398,960       411,648    0.19     0.0           0.45  !$omp parallel @exch_qbc.f:244
         OMP     1,398,960       411,648    0.19     0.0           0.45  !$omp parallel @exch_qbc.f:255
         OMP       702,960       206,848    0.93     0.0           4.49  !$omp parallel @rhs.f:28
         OMP       699,480       205,824    0.12     0.0           0.57  !$omp parallel @add.f:22
         OMP       699,480       205,824    0.21     0.0           1.01  !$omp parallel @z_solve.f:43
         OMP       699,480       205,824    0.21     0.0           1.01  !$omp parallel @x_solve.f:46
         OMP       699,480       205,824    0.21     0.0           1.02  !$omp parallel @y_solve.f:43
         MPI       429,336       112,962    0.65     0.0           5.74  MPI_Irecv
         MPI       429,336       112,962    4.12     0.1          36.48  MPI_Isend
         OMP       418,080       411,648    2.28     0.0           5.53  !$omp do @exch_qbc.f:204
         OMP       418,080       411,648    0.55     0.0           1.35  !$omp implicit barrier @exch_qbc.f:213
         OMP       418,080       411,648    1.75     0.0           4.26  !$omp do @exch_qbc.f:215
         OMP       418,080       411,648    0.47     0.0           1.14  !$omp implicit barrier @exch_qbc.f:224
         OMP       418,080       411,648    2.81     0.1           6.82  !$omp do @exch_qbc.f:244
         OMP       418,080       411,648    0.63     0.0           1.52  !$omp implicit barrier @exch_qbc.f:253
         OMP       418,080       411,648    2.31     0.0           5.62  !$omp do @exch_qbc.f:255
         OMP       418,080       411,648    0.52     0.0           1.27  !$omp implicit barrier @exch_qbc.f:264
         OMP       210,080       206,848    0.44     0.0           2.15  !$omp implicit barrier @rhs.f:439
         OMP       210,080       206,848   20.74     0.4         100.24  !$omp do @rhs.f:37
         OMP       210,080       206,848   18.05     0.4          87.25  !$omp do @rhs.f:62
         OMP       210,080       206,848    1.35     0.0           6.55  !$omp implicit barrier @rhs.f:72
         OMP       210,080       206,848   31.36     0.6         151.61  !$omp do @rhs.f:80
         OMP       210,080       206,848   29.51     0.6         142.68  !$omp do @rhs.f:191
         OMP       210,080       206,848   23.38     0.5         113.02  !$omp do @rhs.f:301
         OMP       210,080       206,848    5.61     0.1          27.13  !$omp implicit barrier @rhs.f:353
         OMP       210,080       206,848    0.62     0.0           2.99  !$omp do @rhs.f:359
         OMP       210,080       206,848    0.46     0.0           2.21  !$omp do @rhs.f:372
         OMP       210,080       206,848   10.30     0.2          49.80  !$omp do @rhs.f:384
         OMP       210,080       206,848    0.58     0.0           2.78  !$omp do @rhs.f:400
         OMP       210,080       206,848    0.39     0.0           1.89  !$omp do @rhs.f:413
         OMP       210,080       206,848    0.92     0.0           4.44  !$omp implicit barrier @rhs.f:423
         OMP       210,080       206,848    3.17     0.1          15.33  !$omp do @rhs.f:428
         OMP       209,040       205,824    8.36     0.2          40.62  !$omp do @add.f:22
         OMP       209,040       205,824    0.89     0.0           4.35  !$omp implicit barrier @add.f:33
         OMP       209,040       205,824  185.22     3.7         899.88  !$omp implicit barrier @z_solve.f:428
         OMP       209,040       205,824  632.18    12.5        3071.45  !$omp do @z_solve.f:52
         OMP       209,040       205,824  169.53     3.4         823.67  !$omp implicit barrier @x_solve.f:407
         OMP       209,040       205,824  610.73    12.1        2967.25  !$omp do @x_solve.f:54
         OMP       209,040       205,824  177.68     3.5         863.28  !$omp implicit barrier @y_solve.f:406
         OMP       209,040       205,824  638.08    12.6        3100.13  !$omp do @y_solve.f:52
         COM       209,040       205,824    0.81     0.0           3.91  copy_x_face_
         COM       209,040       205,824    0.75     0.0           3.63  copy_y_face_
         MPI       125,424       112,962   93.58     1.9         828.44  MPI_Waitall
         OMP        52,520        51,712    0.03     0.0           0.60  !$omp master @rhs.f:74
         OMP        52,520        51,712    0.03     0.0           0.50  !$omp master @rhs.f:183
         OMP        52,520        51,712    0.02     0.0           0.46  !$omp master @rhs.f:293
         OMP        52,520        51,712    0.02     0.0           0.30  !$omp master @rhs.f:424
         COM        52,520        51,712    0.31     0.0           6.09  compute_rhs_
         COM        52,260        51,456    0.22     0.0           4.27  adi_
         COM        52,260        51,456    0.36     0.0           6.94  x_solve_
         COM        52,260        51,456    0.35     0.0           6.73  y_solve_
         COM        52,260        51,456    0.35     0.0           6.88  z_solve_
         COM        52,260        51,456    0.29     0.0           5.62  add_
         USR        37,882        40,796    0.00     0.0           0.10  get_comm_index_
         OMP         6,960         2,048    0.01     0.0           2.70  !$omp parallel @initialize.f:28
         COM         5,226         5,628    0.34     0.0          61.16  exch_qbc_
         OMP         5,200         5,120    0.00     0.0           0.80  !$omp atomic @error.f:51
         OMP         5,200         5,120    0.00     0.0           0.28  !$omp atomic @error.f:104
         OMP         3,480         1,024    0.01     0.0           5.34  !$omp parallel @error.f:27
         OMP         3,480         1,024    0.00     0.0           1.90  !$omp parallel @error.f:86
         OMP         3,480         1,024    0.00     0.0           1.96  !$omp parallel @exact_rhs.f:21
         OMP         2,080         2,048    0.04     0.0          18.45  !$omp implicit barrier @initialize.f:204
         OMP         2,080         2,048    0.19     0.0          94.36  !$omp do @initialize.f:31
         OMP         2,080         2,048   11.81     0.2        5765.89  !$omp do @initialize.f:50
         OMP         2,080         2,048    0.06     0.0          30.97  !$omp do @initialize.f:100
         OMP         2,080         2,048    0.06     0.0          30.76  !$omp do @initialize.f:119
         OMP         2,080         2,048    0.09     0.0          45.78  !$omp do @initialize.f:137
         OMP         2,080         2,048    0.09     0.0          45.85  !$omp do @initialize.f:156
         OMP         2,080         2,048    1.83     0.0         892.68  !$omp implicit barrier @initialize.f:167
         OMP         2,080         2,048    0.07     0.0          33.67  !$omp do @initialize.f:174
         OMP         2,080         2,048    0.07     0.0          33.21  !$omp do @initialize.f:192
         OMP         1,040         1,024    0.15     0.0         143.32  !$omp implicit barrier @error.f:54
         OMP         1,040         1,024    0.96     0.0         935.38  !$omp do @error.f:33
         OMP         1,040         1,024    0.00     0.0           2.08  !$omp implicit barrier @error.f:107
         OMP         1,040         1,024    0.02     0.0          17.27  !$omp do @error.f:91
         OMP         1,040         1,024    0.00     0.0           2.48  !$omp implicit barrier @exact_rhs.f:357
         OMP         1,040         1,024    0.21     0.0         201.46  !$omp do @exact_rhs.f:31
         OMP         1,040         1,024    0.08     0.0          80.42  !$omp implicit barrier @exact_rhs.f:41
         OMP         1,040         1,024    0.95     0.0         927.89  !$omp do @exact_rhs.f:46
         OMP         1,040         1,024    1.00     0.0         974.77  !$omp do @exact_rhs.f:147
         OMP         1,040         1,024    0.51     0.0         501.47  !$omp implicit barrier @exact_rhs.f:242
         OMP         1,040         1,024    0.98     0.0         956.34  !$omp do @exact_rhs.f:247
         OMP         1,040         1,024    0.27     0.0         264.42  !$omp implicit barrier @exact_rhs.f:341
         OMP         1,040         1,024    0.02     0.0          20.34  !$omp do @exact_rhs.f:346
         MPI           612           252    0.82     0.0        3266.14  MPI_Bcast
         USR           572           616    0.00     0.0           0.36  timer_clear_
         COM           520           512    0.02     0.0          47.11  initialize_
         COM           260           256    0.00     0.0          12.22  exact_rhs_
         COM           260           256    0.00     0.0           6.18  error_norm_
         COM           260           256    0.00     0.0           5.87  rhs_norm_
         MPI           204            84    0.44     0.0        5205.99  MPI_Reduce
         MPI           136            56    1.36     0.0       24257.44  MPI_Barrier
         MPI            52            56    0.00     0.0           1.83  MPI_Comm_rank
      SCOREP            41            28    0.03     0.0         934.60  bt-mz_C.28
         MPI            26            28    0.00     0.0           4.69  MPI_Comm_size
         MPI            26            28   29.83     0.6     1065350.67  MPI_Comm_split
         MPI            26            28    0.01     0.0         352.54  MPI_Finalize
         MPI            26            28   49.31     1.0     1760964.30  MPI_Init_thread
         COM            26            28    0.11     0.0        3827.25  MAIN__
         COM            26            28    0.01     0.0         224.01  mpi_setup_
         COM            26            28    0.01     0.0         179.26  env_setup_
         USR            26            28    0.00     0.0          47.11  zone_setup_
         USR            26            28    0.01     0.0         262.41  map_zones_
         USR            26            28    0.00     0.0          32.67  zone_starts_
         USR            26            28    0.00     0.0           1.76  set_constants_
         USR            26            28    0.00     0.0         117.36  timer_start_
         USR            26            28    0.00     0.0           8.33  timer_stop_
         USR            26            28    0.00     0.0           1.11  timer_read_
         COM            26            28    0.01     0.0         263.89  verify_
         USR            26             1    0.00     0.0         523.75  print_results_
```

The detailed breakdown by region below the summary provides a classification according to these function groups (column type) for each region found in the summary report. Investigation of this part of the score report reveals that most of the trace data would be generated by about 6.8 billion calls to each of the three routines `binvcrhs`, `matmul_sub` and `matvec_sub` (these routines are highlighted), which are classified as `USR`. And although the percentage of time spent in these routines at first glance suggest that they are important, the average time per visit is below 270 nanoseconds (column `time/visit`). That is, the relative measurement overhead for these functions is substantial, and thus a significant amount of the reported time is very likely spent in the Score-P measurement system rather than in the application itself. Therefore, these routines constitute good candidates for being filtered (like they are good candidates for being inlined by the compiler). Additionally selecting the `lhsinit`, `binvrhs`, and `exact_solution` routines, which generates about 810MB of event data on a single rank with very little runtime impact.

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

The effectiveness of this filter can be examined by scoring the initial summary report again, this time specifying the filter file using the `-f` option of the `scorep-score -r -f ../config/scorep.filt scorep_bt-mz_sum/profile.cubex` command. This way a filter file can be incrementally developed, avoiding the need to conduct many measurements to step-by-step investigate the effect of filtering individual functions.

The output of the aforementioned command will look like this:  
```
Estimated aggregate size of event trace:                   470MB
Estimated requirements for largest trace buffer (max_buf): 19MB
Estimated memory requirements (SCOREP_TOTAL_MEMORY):       27MB
(hint: When tracing set SCOREP_TOTAL_MEMORY=27MB to avoid intermediate flushes
 or reduce requirements using USR regions filters.)

flt     type    max_buf[B]        visits time[s] time[%] time/visit[us]  region
 -       ALL 6,282,548,755 6,586,867,463 5044.19   100.0           0.77  ALL
 -       USR 6,265,237,940 6,574,825,097 2257.25    44.7           0.34  USR
 -       OMP    17,537,080    10,975,232 2602.86    51.6         237.16  OMP
 -       MPI       985,204       339,446  180.12     3.6         530.62  MPI
 -       COM       738,530       727,660    3.93     0.1           5.41  COM
 -    SCOREP            41            28    0.03     0.0         934.60  SCOREP

 *       ALL    19,298,841    12,083,275 2786.95    55.3         230.65  ALL-FLT
 +       FLT 6,265,199,954 6,574,784,188 2257.24    44.7           0.34  FLT
 -       OMP    17,537,080    10,975,232 2602.86    51.6         237.16  OMP-FLT
 -       MPI       985,204       339,446  180.12     3.6         530.62  MPI-FLT
 *       COM       738,530       727,660    3.93     0.1           5.41  COM-FLT
 *       USR        38,012        40,909    0.01     0.0           0.34  USR-FLT
 -    SCOREP            41            28    0.03     0.0         934.60  SCOREP-FLT

 +       USR 2,014,873,848 2,110,313,472  913.03    18.1           0.43  binvcrhs_
 +       USR 2,014,873,848 2,110,313,472  553.30    11.0           0.26  matvec_sub_
 +       USR 2,014,873,848 2,110,313,472  718.20    14.2           0.34  matmul_sub_
 +       USR    88,951,746    87,475,200   31.80     0.6           0.36  lhsinit_
 +       USR    88,951,746    87,475,200   24.24     0.5           0.28  binvrhs_
 +       USR    64,926,576    68,892,672   16.66     0.3           0.24  exact_solution_
 -       OMP     1,398,960       411,648    0.18     0.0           0.43  !$omp parallel @exch_qbc.f:204
 -       OMP     1,398,960       411,648    0.18     0.0           0.44  !$omp parallel @exch_qbc.f:215
 -       OMP     1,398,960       411,648    0.19     0.0           0.45  !$omp parallel @exch_qbc.f:244
 -       OMP     1,398,960       411,648    0.19     0.0           0.45  !$omp parallel @exch_qbc.f:255
 -       OMP       702,960       206,848    0.93     0.0           4.49  !$omp parallel @rhs.f:28
 -       OMP       699,480       205,824    0.12     0.0           0.57  !$omp parallel @add.f:22
 -       OMP       699,480       205,824    0.21     0.0           1.01  !$omp parallel @z_solve.f:43
 -       OMP       699,480       205,824    0.21     0.0           1.01  !$omp parallel @x_solve.f:46
 -       OMP       699,480       205,824    0.21     0.0           1.02  !$omp parallel @y_solve.f:43
 -       MPI       429,336       112,962    0.65     0.0           5.74  MPI_Irecv
 -       MPI       429,336       112,962    4.12     0.1          36.48  MPI_Isend
 -       OMP       418,080       411,648    2.28     0.0           5.53  !$omp do @exch_qbc.f:204
 -       OMP       418,080       411,648    0.55     0.0           1.35  !$omp implicit barrier @exch_qbc.f:213
 -       OMP       418,080       411,648    1.75     0.0           4.26  !$omp do @exch_qbc.f:215
 -       OMP       418,080       411,648    0.47     0.0           1.14  !$omp implicit barrier @exch_qbc.f:224
 -       OMP       418,080       411,648    2.81     0.1           6.82  !$omp do @exch_qbc.f:244
 -       OMP       418,080       411,648    0.63     0.0           1.52  !$omp implicit barrier @exch_qbc.f:253
 -       OMP       418,080       411,648    2.31     0.0           5.62  !$omp do @exch_qbc.f:255
 -       OMP       418,080       411,648    0.52     0.0           1.27  !$omp implicit barrier @exch_qbc.f:264
 -       OMP       210,080       206,848    0.44     0.0           2.15  !$omp implicit barrier @rhs.f:439
 -       OMP       210,080       206,848   20.74     0.4         100.24  !$omp do @rhs.f:37
 -       OMP       210,080       206,848   18.05     0.4          87.25  !$omp do @rhs.f:62
 -       OMP       210,080       206,848    1.35     0.0           6.55  !$omp implicit barrier @rhs.f:72
 -       OMP       210,080       206,848   31.36     0.6         151.61  !$omp do @rhs.f:80
 -       OMP       210,080       206,848   29.51     0.6         142.68  !$omp do @rhs.f:191
 -       OMP       210,080       206,848   23.38     0.5         113.02  !$omp do @rhs.f:301
 -       OMP       210,080       206,848    5.61     0.1          27.13  !$omp implicit barrier @rhs.f:353
 -       OMP       210,080       206,848    0.62     0.0           2.99  !$omp do @rhs.f:359
 -       OMP       210,080       206,848    0.46     0.0           2.21  !$omp do @rhs.f:372
 -       OMP       210,080       206,848   10.30     0.2          49.80  !$omp do @rhs.f:384
 -       OMP       210,080       206,848    0.58     0.0           2.78  !$omp do @rhs.f:400
 -       OMP       210,080       206,848    0.39     0.0           1.89  !$omp do @rhs.f:413
 -       OMP       210,080       206,848    0.92     0.0           4.44  !$omp implicit barrier @rhs.f:423
 -       OMP       210,080       206,848    3.17     0.1          15.33  !$omp do @rhs.f:428
 -       OMP       209,040       205,824    8.36     0.2          40.62  !$omp do @add.f:22
 -       OMP       209,040       205,824    0.89     0.0           4.35  !$omp implicit barrier @add.f:33
 -       OMP       209,040       205,824  185.22     3.7         899.88  !$omp implicit barrier @z_solve.f:428
 -       OMP       209,040       205,824  632.18    12.5        3071.45  !$omp do @z_solve.f:52
 -       OMP       209,040       205,824  169.53     3.4         823.67  !$omp implicit barrier @x_solve.f:407
 -       OMP       209,040       205,824  610.73    12.1        2967.25  !$omp do @x_solve.f:54
 -       OMP       209,040       205,824  177.68     3.5         863.28  !$omp implicit barrier @y_solve.f:406
 -       OMP       209,040       205,824  638.08    12.6        3100.13  !$omp do @y_solve.f:52
 -       COM       209,040       205,824    0.81     0.0           3.91  copy_x_face_
 -       COM       209,040       205,824    0.75     0.0           3.63  copy_y_face_
 -       MPI       125,424       112,962   93.58     1.9         828.44  MPI_Waitall
 -       OMP        52,520        51,712    0.03     0.0           0.60  !$omp master @rhs.f:74
 -       OMP        52,520        51,712    0.03     0.0           0.50  !$omp master @rhs.f:183
 -       OMP        52,520        51,712    0.02     0.0           0.46  !$omp master @rhs.f:293
 -       OMP        52,520        51,712    0.02     0.0           0.30  !$omp master @rhs.f:424
 -       COM        52,520        51,712    0.31     0.0           6.09  compute_rhs_
 -       COM        52,260        51,456    0.22     0.0           4.27  adi_
 -       COM        52,260        51,456    0.36     0.0           6.94  x_solve_
 -       COM        52,260        51,456    0.35     0.0           6.73  y_solve_
 -       COM        52,260        51,456    0.35     0.0           6.88  z_solve_
 -       COM        52,260        51,456    0.29     0.0           5.62  add_
 -       USR        37,882        40,796    0.00     0.0           0.10  get_comm_index_
 -       OMP         6,960         2,048    0.01     0.0           2.70  !$omp parallel @initialize.f:28
 -       COM         5,226         5,628    0.34     0.0          61.16  exch_qbc_
 -       OMP         5,200         5,120    0.00     0.0           0.80  !$omp atomic @error.f:51
 -       OMP         5,200         5,120    0.00     0.0           0.28  !$omp atomic @error.f:104
 -       OMP         3,480         1,024    0.01     0.0           5.34  !$omp parallel @error.f:27
 -       OMP         3,480         1,024    0.00     0.0           1.90  !$omp parallel @error.f:86
 -       OMP         3,480         1,024    0.00     0.0           1.96  !$omp parallel @exact_rhs.f:21
 -       OMP         2,080         2,048    0.04     0.0          18.45  !$omp implicit barrier @initialize.f:204
 -       OMP         2,080         2,048    0.19     0.0          94.36  !$omp do @initialize.f:31
 -       OMP         2,080         2,048   11.81     0.2        5765.89  !$omp do @initialize.f:50
 -       OMP         2,080         2,048    0.06     0.0          30.97  !$omp do @initialize.f:100
 -       OMP         2,080         2,048    0.06     0.0          30.76  !$omp do @initialize.f:119
 -       OMP         2,080         2,048    0.09     0.0          45.78  !$omp do @initialize.f:137
 -       OMP         2,080         2,048    0.09     0.0          45.85  !$omp do @initialize.f:156
 -       OMP         2,080         2,048    1.83     0.0         892.68  !$omp implicit barrier @initialize.f:167
 -       OMP         2,080         2,048    0.07     0.0          33.67  !$omp do @initialize.f:174
 -       OMP         2,080         2,048    0.07     0.0          33.21  !$omp do @initialize.f:192
 -       OMP         1,040         1,024    0.15     0.0         143.32  !$omp implicit barrier @error.f:54
 -       OMP         1,040         1,024    0.96     0.0         935.38  !$omp do @error.f:33
 -       OMP         1,040         1,024    0.00     0.0           2.08  !$omp implicit barrier @error.f:107
 -       OMP         1,040         1,024    0.02     0.0          17.27  !$omp do @error.f:91
 -       OMP         1,040         1,024    0.00     0.0           2.48  !$omp implicit barrier @exact_rhs.f:357
 -       OMP         1,040         1,024    0.21     0.0         201.46  !$omp do @exact_rhs.f:31
 -       OMP         1,040         1,024    0.08     0.0          80.42  !$omp implicit barrier @exact_rhs.f:41
 -       OMP         1,040         1,024    0.95     0.0         927.89  !$omp do @exact_rhs.f:46
 -       OMP         1,040         1,024    1.00     0.0         974.77  !$omp do @exact_rhs.f:147
 -       OMP         1,040         1,024    0.51     0.0         501.47  !$omp implicit barrier @exact_rhs.f:242
 -       OMP         1,040         1,024    0.98     0.0         956.34  !$omp do @exact_rhs.f:247
 -       OMP         1,040         1,024    0.27     0.0         264.42  !$omp implicit barrier @exact_rhs.f:341
 -       OMP         1,040         1,024    0.02     0.0          20.34  !$omp do @exact_rhs.f:346
 -       MPI           612           252    0.82     0.0        3266.14  MPI_Bcast
 +       USR           572           616    0.00     0.0           0.36  timer_clear_
 -       COM           520           512    0.02     0.0          47.11  initialize_
 -       COM           260           256    0.00     0.0          12.22  exact_rhs_
 -       COM           260           256    0.00     0.0           6.18  error_norm_
 -       COM           260           256    0.00     0.0           5.87  rhs_norm_
 -       MPI           204            84    0.44     0.0        5205.99  MPI_Reduce
 -       MPI           136            56    1.36     0.0       24257.44  MPI_Barrier
 -       MPI            52            56    0.00     0.0           1.83  MPI_Comm_rank
 -    SCOREP            41            28    0.03     0.0         934.60  bt-mz_C.28
 -       MPI            26            28    0.00     0.0           4.69  MPI_Comm_size
 -       MPI            26            28   29.83     0.6     1065350.67  MPI_Comm_split
 -       MPI            26            28    0.01     0.0         352.54  MPI_Finalize
 -       MPI            26            28   49.31     1.0     1760964.30  MPI_Init_thread
 -       COM            26            28    0.11     0.0        3827.25  MAIN__
 -       COM            26            28    0.01     0.0         224.01  mpi_setup_
 -       COM            26            28    0.01     0.0         179.26  env_setup_
 -       USR            26            28    0.00     0.0          47.11  zone_setup_
 -       USR            26            28    0.01     0.0         262.41  map_zones_
 -       USR            26            28    0.00     0.0          32.67  zone_starts_
 -       USR            26            28    0.00     0.0           1.76  set_constants_
 +       USR            26            28    0.00     0.0         117.36  timer_start_
 +       USR            26            28    0.00     0.0           8.33  timer_stop_
 +       USR            26            28    0.00     0.0           1.11  timer_read_
 -       COM            26            28    0.01     0.0         263.89  verify_
 -       USR            26             1    0.00     0.0         523.75  print_results_
```

Below the (original) function group summary, the score report now also includes a second summary with the filter applied. Here, an additional group `FLT` is added, which subsumes all filtered regions. Moreover, the column `flt` indicates whether a region/function group is filtered (`+`), not filtered (`-`), or possibly partially filtered (`∗`, only used for function groups).

As expected, the estimate for the aggregate event trace size drops down to 470MB, and the process-local maximum across all ranks is reduced to 19MB. Since the Score-P measurement system also creates a number of internal data structures (e.g., to track MPI requests and communicators), the suggested setting for the `SCOREP_TOTAL_MEMORY` environment variable to adjust the maximum amount of memory used by the Score-P memory management is 27MB when tracing is configured.

:::

With the `-g` option, `scorep-score` can create an initial filter file in Score-P format. See more details [here](https://perftools.pages.jsc.fz-juelich.de/cicd/scorep/tags/latest/html/score.html). 

:::

Let's modify our batch script `score.sbatch` to enable filtering (see highlighted lines):
```bash showLineNumbers
#!/bin/bash
#SBATCH -o bt-mz.%j.out
#SBATCH -e bt-mz.%j.err
#SBATCH -J bt-mz
#SBATCH --clusters=cm2_tiny
#SBATCH --partition=cm2_tiny
#SBATCH --reservation=hhps1s24
#SBATCH --nodes=2
#SBATCH --ntasks=28
#SBATCH --ntasks-per-node=14
#SBATCH --get-user-env
#SBATCH --time=00:05:00

module use /lrz/sys/courses/vihps/2024/modulefiles/
module load scorep/8.4-intel-intelmpi
export OMP_NUM_THREADS=4

# Score-P measurement configuration
# highlight-start
export SCOREP_EXPERIMENT_DIRECTORY=scorep_bt-mz_sum_filt
export SCOREP_FILTERING_FILE=../config/scorep.filt
# highlight-start

# Benchmark configuration (disable load balancing with threads)
export NPB_MZ_BLOAD=0
PROCS=28
CLASS=C

# Run the application
mpiexec -n $SLURM_NTASKS ./bt-mz_$CLASS.$PROCS
```
In first highlighted line we added suffix `_filt` to create measurement directory with a different name. In the second one we provided name of the filter file which will be used during the measurement.

:::info

If you do not specify `SCOREP_EXPERIMENT_DIRECTORY` variable, the experiment directory is named in the format `scorep-YYYYMMDD_HHMM_XXXXXXXX`, where `YYYYMMDD` and `HHMM` represent the date and time, followed by random numbers.

If a directory with the specified name already exists, it will be renamed with a date suffix by default. To prevent this and abort the measurement if the directory exists, set `SCOREP_OVERWRITE_EXPERIMENT_DIRECTORY` to `false`. This setting is effective only if `SCOREP_EXPERIMENT_DIRECTORY` is set.

:::

Now we are ready to submit our batch script with enabled filtering
```bash
$ sbatch scorep.sbatch
```

:::tip[Question]

Open the freshly generated stdout file and find the metric "Time in seconds". Compare it to our baseline measurement [here](./baseline.md) and our original instrumented run [here](./instrumentation.md). Has it increased or decreased? If so, by how much? Which routines in your opinion are safe to filter?

:::