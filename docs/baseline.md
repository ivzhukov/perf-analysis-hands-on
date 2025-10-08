---
sidebar_position: 1

---
# Baseline measurement

In this part we are going to build and run a specific benchmark to identify how long it runs without any specific tools (also called as a reference/baseline run). A reference run provides a valuable point of comparison and context for performance analysis, enabling more informed decision-making and effective optimization efforts.

## Initial setup

First of all let's login into HLRS training cluster using ssh:

```bash
$ ssh -Y userid@training.hlrs.de
```
The **-Y** option is necessary to enable X11 forwarding. X11 forwarding is a SSH protocol that enables users to run graphical applications on a remote server and interact with them using their local display and I/O devices.

Now we need to create our own directory for the exercises:

```bash
$ mkdir -p $HOME/performance_analysis
```
The **-p** prevents error messages if the specified directories already exists.

Then, we need to load required software, e.g. compiler, MPI, text editor:

```bash
$ module load compiler/gcc/14.2.0 mpi/openmpi/5.0.7-gcc-14.2.0
```

## Build benchmark

Start by copying the tutorial sources to your working directory:
```bash
$ cd $HOME/performance_analysis
$ tar xvf /zhome/training/sct50052/NPB3.3-MZ-MPI.tar.gz
$ cd $HOME/performance_analysis/NPB3.3-MZ-MPI
```

For this tutorial we are going to use the NAS Parallel Benchmark suite (MPI+OpenMP version). It is available [here](http://www.nas.nasa.gov/Software/NPB), and includes three benchmarks written in Fortran77. You can configure the benchmark for various sizes and classes. This allows the benchmark to be used on a wide range of systems, from workstations to supercomputers.

:::info

NPB solves discretized versions of the unsteady, compressible Navier-Stokes equations in three spatial dimensions. Each operates on a structured discretization mesh that is a logical cube. In realistic applications, however, a single such mesh is often not sufficient to describe a complex domain, and multiple meshes or zones are used to cover it.

Multi-zone versions of NPB (NPB-MZ) are designed to exploit multiple levels of parallelism in applications and to test the effectiveness of multi-level and hybrid parallelization paradigms and tools. There are three types of benchmark problems derived from single-zone pseudo applications of NPB:

* **Block Tri-diagonal (BT)** - uneven-sized zones within a problem class, increased number of zones as problem class grows
* **Scalar Penta-diagonal (SP)** - even-sized zones within a problem class, increased number of zones as problem class grows
* **Lower-Upper Symmetric Gauss-Seidel (LU)** - even-sized zones within a problem class, a fixed number of zones for all problem classes

Benchmark Classes

* Class **S**: small for quick test purposes
* Class **W**: workstation size (a 90's workstation; now likely too small)
* Classes **A**, **B**, **C**: standard test problems; ~4X size increase going from one class to the next
* Classes **D**, **E**, **F**: large test problems; ~16X size increase from each of the previous classes

MPI is used for communication across zones and OpenMP threads for computation inside zones. More technical details are provided in this [paper](https://www.nas.nasa.gov/assets/nas/pdf/techreports/2003/nas-03-010.pdf).
:::

Move into the NPB3.3-MZ-MPI root directory and check what is inside:
```bash
$ ls
bin/    common/  jobscript/  Makefile  README.install   SP-MZ/
BT-MZ/  config/  LU-MZ/      README    README.tutorial  sys/
```

Subdirectories ```BT-MZ```, ```LU-MZ``` and ```SP-MZ``` contain source code for each benchmark, ```config``` and ```common``` include additional configuration and common code. The provided distribution has already been configured for the hands-on, such that it is ready to be build.  

During this hands-on we will focus on ```BT-MZ``` exercise. It performs 200 time-steps on a regular 3-dimensional grid. It uses combination of MPI and OpenMP.

Type ```make``` for instructions
```
$ make
    ===========================================
   =      NAS PARALLEL BENCHMARKS 3.3        =
   =      MPI+OpenMP Multi-Zone Versions     =
   =      F77                                =
   ===========================================


   To make a NAS multi-zone benchmark type

         make <benchmark-name> CLASS=<class> NPROCS=<nprocs>

   where <benchmark-name> is "bt-mz", "lu-mz", or "sp-mz"
         <class>          is "S", "W", "A" through "F"
         <nprocs>         is number of processes

   To make a set of benchmarks, create the file config/suite.def
   according to the instructions in config/suite.def.template and type

         make suite

 ***************************************************************
 * Custom build configuration is specified in config/make.def  *
 * Suggested tutorial exercise configuration for LiveDVD:      *
 *       make bt-mz CLASS=W NPROCS=4                           *
 ***************************************************************
 ```

To build application the following parameters need to be specified:
* The benchmark configuration benchmark name (bt-mz, lu-mz, sp-mz): ```bt-mz```
* The number of MPI processes: ```NPROCS=8```
* The benchmark class (S, W, A, B, C, D, E): ```CLASS=B```

Alternatively, you can just use ```make suite```.

```bash
$ make bt-mz CLASS=B NPROCS=8
   ===========================================
   =      NAS PARALLEL BENCHMARKS 3.3        =
   =      MPI+OpenMP Multi-Zone Versions     =
   =      F77                                =
   ===========================================

cd BT-MZ; make CLASS=B NPROCS=8 VERSION=
make[1]: Entering directory '/zhome/training/sct50052/performance_analysis/NPB3.3-MZ-MPI/BT-MZ'
make[2]: Entering directory '/zhome/training/sct50052/performance_analysis/NPB3.3-MZ-MPI/sys'
cc  -o setparams setparams.c -lm
make[2]: Leaving directory '/zhome/training/sct50052/performance_analysis/NPB3.3-MZ-MPI/sys'
../sys/setparams bt-mz 8 B
make[2]: Entering directory '/zhome/training/sct50052/performance_analysis/NPB3.3-MZ-MPI/BT-MZ'
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  bt.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  initialize.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  exact_solution.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  exact_rhs.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  set_constants.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  adi.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  rhs.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  zone_setup.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  x_solve.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  y_solve.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  exch_qbc.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  solve_subs.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  z_solve.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  add.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  error.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  verify.f
mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  mpi_setup.f
cd ../common; mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  print_results.f
cd ../common; mpif77 -c  -O3 -fopenmp	 -w -fallow-argument-mismatch  timers.f
mpif77 -O3 -fopenmp	 -w -fallow-argument-mismatch  -o ../bin/bt-mz_B.8 bt.o  initialize.o exact_solution.o exact_rhs.o set_constants.o adi.o  rhs.o zone_setup.o x_solve.o y_solve.o  exch_qbc.o solve_subs.o z_solve.o add.o error.o verify.o mpi_setup.o ../common/print_results.o ../common/timers.o
make[2]: Leaving directory '/zhome/training/sct50052/performance_analysis/NPB3.3-MZ-MPI/BT-MZ'
Built executable ../bin/bt-mz_B.8
make[1]: Leaving directory '/zhome/training/sct50052/performance_analysis/NPB3.3-MZ-MPI/BT-MZ'
```
If compilation succeeds, you can find in the ```bin``` directory.

## Run benchmark
Lets go to the ```bin``` directory, copy a prepared batch script and examine what it does:
```bash
$ cd bin
$ cp ../jobscript/hlrs_training/reference.pbs .
$ nano reference.pbs
```
Here is what you should see in your batch script:
```bash
#!/bin/bash
# submit from ./bin subdirectory with "qsub reference.pbs"
#
#PBS -N mzmpibt
#PBS -l select=2:node_type=skl:mem=10gb:mpiprocs=4:ncpus=20
#PBS -q smp
#PBS -l place=scatter
#PBS -l walltime=00:10:00

cd $PBS_O_WORKDIR

# Benchmark configuration
export NPB_MZ_BLOAD=0
export OMP_NUM_THREADS=10
CLASS=B
NPROCS=8
EXE=./bt-mz_$CLASS.$NPROCS

module load compiler/gcc/14.2.0 mpi/openmpi/5.0.7-gcc-14.2.0

# Run the application
mpirun --report-bindings $EXE
```
To exit text editor you can use ```Ctrl+X```

On HLRS training cluster we are going to use skl partition:
* 2 compute nodes with 2 x Intel Xeon Gold 6138 @ 2.0GHz Skylake, 40 cores per node
* 10GB RAM per node
* Our application will use 8 MPI ranks in total, 4 MPI ranks per node and 10 OpenMP threads per MPI rank

Now we are ready to submit our batch script:
```bash
$ qsub reference.pbs
```

:::info

To submit the job use ```qsub <script you want to submit>```.

To check status of all your jobs use ```qstat -u $USER```.

To cancel specific job use ```qdel <jobid you want to cancel>```.

:::

Once the job has finished you will see two files in your directory, one with standard output ```mzmpibt.o<jobid>``` and one with standard error output ```mzmpibt.e<jobid>```. The former one should include all output provided by your application and the latter one only system specific output. Let's examine standard output file:

 ```
 $ cat mzmpibt.o<jobid>
 NAS Parallel Benchmarks (NPB3.3-MZ-MPI) - BT-MZ MPI+OpenMP Benchmark

 Number of zones:   8 x   8
 Iterations: 200    dt:   0.000300
 Number of active processes:     8

 Use the default load factors with threads
 Total number of threads:     80  ( 10.0 threads/process)

 Calculated speedup =     78.79

 Time step    1
 Time step   20
 Time step   40
 Time step   60
 Time step   80
 Time step  100
 Time step  120
 Time step  140
 Time step  160
 Time step  180
 Time step  200
 Verification being performed for class B
 accuracy setting for epsilon =  0.1000000000000E-07
 Comparison of RMS-norms of residual
           1 0.4461388343844E+06 0.4461388343844E+06 0.3261745920067E-14
           2 0.3799759138035E+05 0.3799759138035E+05 0.1007209553561E-12
           3 0.8383296623970E+05 0.8383296623970E+05 0.3506361528143E-13
           4 0.5301970201273E+05 0.5301970201273E+05 0.5928388070858E-13
           5 0.3618106851311E+06 0.3618106851311E+06 0.2863642249494E-13
 Comparison of RMS-norms of solution error
           1 0.4496733567600E+05 0.4496733567600E+05 0.8430061198873E-13
           2 0.3892068540524E+04 0.3892068540524E+04 0.7325836789283E-13
           3 0.8763825844217E+04 0.8763825844217E+04 0.4981357053542E-13
           4 0.5599040091792E+04 0.5599040091792E+04 0.8154368120338E-13
           5 0.4082652045598E+05 0.4082652045598E+05 0.6326684038186E-13
 Verification Successful


 BT-MZ Benchmark Completed.
 Class           =                        B
 Size            =            304x  208x 17
 Iterations      =                      200
 Time in seconds =                    23.09
 Total processes =                        8
 Total threads   =                       80
 Mop/s total     =                 26041.43
 Mop/s/thread    =                   325.52
 Operation type  =           floating point
 Verification    =               SUCCESSFUL
 Version         =                    3.3.1
 Compile date    =              08 Oct 2025
 ```

The most important metric in the output is "Time in seconds" which indicates how much time the application spent executing 200 iterations (pre and post. processing are excluded from the time measurement). Further, "Validation" is important as it indicates if the computation completed successfully (e.g. converged). Please write down the time value you received, as we are going to refer to its value in the next section.

:::info

For time measurements you can use ```time``` utility which is used to measure the execution time of a program or command. It provides information about how long a particular process took to execute, including user time, system time, and real time, i.e.
* **User time** is the time spent executing user-space instructions.
* **System time** is the time spent executing system calls.
* **Real time** is the actual time elapsed from start to finish, including all waiting and execution time.

It's a handy tool for performance analysis and optimization.

:::

:::tip[Question]

In this exercise we measured the basic performance metric, i.e. walltime. What else do you think can be used to measure the performance of the application in general and of the code you are working on?

:::
