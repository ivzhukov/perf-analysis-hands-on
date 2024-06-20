---
sidebar_position: 1
---
# Baseline measurement

In this part we are going to build and run a specific benchmark to identify how long it runs without any specific tools (also called as a reference/baseline run). A reference run provides a valuable point of comparison and context for performance analysis, enabling more informed decision-making and effective optimization efforts.

## Initial setup

First of all let's login into CoolMUC-2 using ssh:

```bash
$ ssh -Y userid@lxlogin1.lrz.de
```
The **-Y** option is necessary to enable X11 forwarding. X11 forwarding is a SSH protocol that enables users to run graphical applications on a remote server and interact with them using their local display and I/O devices.

Now we need to create our own directory for the exercises:

```bash
$ mkdir -p $HOME/tw45
```
The **-p** prevents error messages if the specified directories already exists.

Then, we need to load required software, e.g. compiler, MPI, text editor:

```bash
$ module load intel intel-mpi/2019-intel nano
```

## Build benchmark

Start by copying the tutorial sources to your working directory:
```bash
$ cd $HOME/tw45
$ tar zxvf /lrz/sys/courses/vihps/2024/material/NPB3.3-MZ-MPI.tar.gz -C .
$ cd $HOME/tw45/NPB3.3-MZ-MPI
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
* The number of MPI processes: ```NPROCS=28```
* The benchmark class (S, W, A, B, C, D, E): ```CLASS=C```

Alternatively, you can just use ```make suite```.

```bash
$ make bt-mz CLASS=C NPROCS=28
    ===========================================
   =      NAS PARALLEL BENCHMARKS 3.3        =
   =      MPI+OpenMP Multi-Zone Versions     =
   =      F77                                =
   ===========================================

cd BT-MZ; make CLASS=C NPROCS=28 VERSION=
make[1]: Entering directory '/dss/dsshome1/0C/hpckurs11/tw45/NPB3.3-MZ-MPI/BT-MZ'
make[2]: Entering directory '/dss/dsshome1/0C/hpckurs11/tw45/NPB3.3-MZ-MPI/sys'
cc  -o setparams setparams.c -lm
make[2]: Leaving directory '/dss/dsshome1/0C/hpckurs11/tw45/NPB3.3-MZ-MPI/sys'
../sys/setparams bt-mz 28 C
make[2]: Entering directory '/dss/dsshome1/0C/hpckurs11/tw45/NPB3.3-MZ-MPI/BT-MZ'
mpif77 -c  -O3 -g -qopenmp	 bt.f
mpif77 -c  -O3 -g -qopenmp	 initialize.f
mpif77 -c  -O3 -g -qopenmp	 exact_solution.f
mpif77 -c  -O3 -g -qopenmp	 exact_rhs.f
mpif77 -c  -O3 -g -qopenmp	 set_constants.f
mpif77 -c  -O3 -g -qopenmp	 adi.f
mpif77 -c  -O3 -g -qopenmp	 rhs.f
mpif77 -c  -O3 -g -qopenmp	 zone_setup.f
mpif77 -c  -O3 -g -qopenmp	 x_solve.f
mpif77 -c  -O3 -g -qopenmp	 y_solve.f
mpif77 -c  -O3 -g -qopenmp	 exch_qbc.f
mpif77 -c  -O3 -g -qopenmp	 solve_subs.f
mpif77 -c  -O3 -g -qopenmp	 z_solve.f
mpif77 -c  -O3 -g -qopenmp	 add.f
mpif77 -c  -O3 -g -qopenmp	 error.f
mpif77 -c  -O3 -g -qopenmp	 verify.f
mpif77 -c  -O3 -g -qopenmp	 mpi_setup.f
cd ../common; mpif77 -c  -O3 -g -qopenmp	 print_results.f
cd ../common; mpif77 -c  -O3 -g -qopenmp	 timers.f
mpif77 -O3 -g -qopenmp	 -o ../bin/bt-mz_C.28 bt.o  initialize.o exact_solution.o exact_rhs.o set_constants.o adi.o  rhs.o zone_setup.o x_solve.o y_solve.o  exch_qbc.o solve_subs.o z_solve.o add.o error.o verify.o mpi_setup.o ../common/print_results.o ../common/timers.o
make[2]: Leaving directory '/dss/dsshome1/0C/hpckurs11/tw45/NPB3.3-MZ-MPI/BT-MZ'
Built executable ../bin/bt-mz_C.28
make[1]: Leaving directory '/dss/dsshome1/0C/hpckurs11/tw45/NPB3.3-MZ-MPI/BT-MZ'
```
If compilation succeeds, you can find in the ```bin``` directory.

## Run benchmark
Lets go to the ```bin``` directory, copy a prepared batch script and examine what it does:
```bash
$ cd bin
$ cp ../jobscript/coolmuc2/reference.sbatch .
$ nano reference.sbatch
```
Here is what you should see in your batch script:
```bash
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

export OMP_NUM_THREADS=4

# Benchmark configuration (disable load balancing with threads)
export NPB_MZ_BLOAD=0
PROCS=28
CLASS=C

# Run the application
mpiexec -n $SLURM_NTASKS ./bt-mz_$CLASS.$PROCS
```
To exit text editor you can use ```Ctrl+X```

On CoolMUC-2 we are going to use:
* 2 standard compute nodes with 2x Intel Haswell 14-Core Processor each (28 cores / 56 threads)
* 56GB RAM per node
* 14 MPI ranks per node and 4 OpenMP threads per MPI rank

Now we are ready to submit our batch script:
```bash
$ sbatch reference.sbatch
```

:::info

To submit the job use ```sbatch <script you want to submit>```.

To check status of all your jobs use ```squeue -M cm2_tiny --me```.

To cancel specific job use ```scancel -M cm2_tiny <jobid you want to cancel>```.

:::

Once the job has finished you will see two files in your directory, one with standard output ```bt-mz.<jobid>.out``` and one with standard error output ```bt-mz.<jobid>.err```. The former one should include all output provided by your application and the latter one only system specific output. Let's examine standard output file:

 ```
 $ cat bt-mz.<jobid>.out
 NAS Parallel Benchmarks (NPB3.3-MZ-MPI) - BT-MZ MPI+OpenMP Benchmark

 Number of zones:  16 x  16
 Iterations: 200    dt:   0.000100
 Number of active processes:    28

 Use the default load factors with threads
 Total number of threads:    112  (  4.0 threads/process)

 Calculated speedup =    110.34

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
 Verification being performed for class C
 accuracy setting for epsilon =  0.1000000000000E-07
 Comparison of RMS-norms of residual
           1 0.3457703287806E+07 0.3457703287806E+07 0.1092202750127E-12
           2 0.3213621375929E+06 0.3213621375929E+06 0.1320422658492E-12
           3 0.7002579656870E+06 0.7002579656870E+06 0.1496217033982E-13
           4 0.4517459627471E+06 0.4517459627471E+06 0.2280652586031E-13
           5 0.2818715870791E+07 0.2818715870791E+07 0.1486830094937E-14
 Comparison of RMS-norms of solution error
           1 0.2059106993570E+06 0.2059106993570E+06 0.1540627820550E-12
           2 0.1680761129461E+05 0.1680761129461E+05 0.2132015705369E-12
           3 0.4080731640795E+05 0.4080731640795E+05 0.3084595553087E-13
           4 0.2836541076778E+05 0.2836541076778E+05 0.1026032398931E-12
           5 0.2136807610771E+06 0.2136807610771E+06 0.2335870996607E-12
 Verification Successful


 BT-MZ Benchmark Completed.
 Class           =                        C
 Size            =            480x  320x 28
 Iterations      =                      200
 Time in seconds =                    13.91
 Total processes =                       28
 Total threads   =                      112
 Mop/s total     =                174439.35
 Mop/s/thread    =                  1557.49
 Operation type  =           floating point
 Verification    =               SUCCESSFUL
 Version         =                    3.3.1
 Compile date    =              04 Jun 2024
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