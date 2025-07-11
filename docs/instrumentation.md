---
sidebar_position: 2
---
# Instrumentation
 
 As a next step we are going to instrument our application, i.e. insert additional code into our program to collect performance data during its execution. Instrumentation can be done either manually by the programmer or automatically by tools like Score-P. The data collected includes information about user function calls, communication events, synchronization events, and more.
 
 Score-P can automatically instrument the code by using e.g. compiler wrappers. This eliminates the need for manual modification of the source code and makes the process easier and less error-prone.

 To use Score-P, we first need to make sure that all required software is available:
```bash
$ # Reload modules if needed
$ module load gcc/10.2.0 openmpi/4.0.5-gcc10.2.0 
$ # Load additional software being used in the following steps
$ module use /jet/home/zhukov/ihpcss25/modules/
$ module load scorep/8.4-gcc_openmpi scalasca/2.6-gcc_openmpi
```

We loaded Scalasca trace tools at this stage as well to use convenience commands that allow to control execution measurement collection and analysis, and analysis report postprocessing. This is not necessary but highly recommended step to do.

Go to our work directory
```bash
$ cd $HOME/ihpcss25/NPB3.3-MZ-MPI
```

Edit `config/make.def` to adjust build (see highlighted lines)

```bash showLineNumbers
#---------------------------------------------------------------------------
#
#                SITE- AND/OR PLATFORM-SPECIFIC DEFINITIONS.
#
#---------------------------------------------------------------------------

#---------------------------------------------------------------------------
# Configured for generic MPI with GCC compiler
#---------------------------------------------------------------------------
OPENMP = -fopenmp      # GCC compiler
#OPENMP  = -qopenmp      # Intel compiler

#---------------------------------------------------------------------------
# Parallel Fortran:
#
# The following must be defined:
#
# MPIF77     - Fortran compiler
# FFLAGS     - Fortran compilation arguments
# F_INC      - any -I arguments required for compiling MPI/Fortran
# FLINK      - Fortran linker
# FLINKFLAGS - Fortran linker arguments
# F_LIB      - any -L and -l arguments required for linking MPI/Fortran
#
# compilations are done with $(MPIF77) $(F_INC) $(FFLAGS) or
#                            $(MPIF77) $(FFLAGS)
# linking is done with       $(FLINK) $(F_LIB) $(FLINKFLAGS)
#---------------------------------------------------------------------------

#---------------------------------------------------------------------------
# The fortran compiler used for hybrid MPI programs
#---------------------------------------------------------------------------
# highlight-next-line
MPIF77 = mpif77

# Alternative variants to perform instrumentation
#MPIF77 = psc_instrument -t user,mpi,omp -s ${PROGRAM}.sir  mpif77
#MPIF77 = scalasca -instrument  mpif77
#MPIF77 = tau_f90.sh
#MPIF77 = vtf77 -vt:hyb -vt:f77  mpif77
# highlight-next-line
MPIF77 = scorep --user  mpif77

# PREP is a generic macro for instrumentation preparation
#MPIF77 = $(PREP)  mpif77

# This links MPI fortran programs; usually the same as ${F77}
FLINK   = $(MPIF77)

#---------------------------------------------------------------------------
# Global *compile time* flags for Fortran programs
#---------------------------------------------------------------------------
FFLAGS  = -O3 $(OPENMP) -fallow-argument-mismatch # GCC
#FFLAGS  = -O3 $(OPENMP) # Intel

#---------------------------------------------------------------------------
# These macros are passed to the compiler
#---------------------------------------------------------------------------
F_INC =

#---------------------------------------------------------------------------
# These macros are passed to the linker
#---------------------------------------------------------------------------
F_LIB  =

#---------------------------------------------------------------------------
# Global *link time* flags. Flags for increasing maximum executable
# size usually go here.
#---------------------------------------------------------------------------
FLINKFLAGS = $(FFLAGS)


#---------------------------------------------------------------------------
# Utilities C:
#
# This is the C compiler used to compile C utilities.  Flags required by
# this compiler go here also; typically there are few flags required; hence
# there are no separate macros provided for such flags.
#---------------------------------------------------------------------------
UCC     = cc


#---------------------------------------------------------------------------
# Destination of executables, relative to subdirs of the main directory.
#---------------------------------------------------------------------------
include ../sys/make.build
BINDIR  = ../bin${BUILD}


#---------------------------------------------------------------------------
# The variable RAND controls which random number generator
# is used. It is described in detail in README.install.
# Use "randi8" unless there is a reason to use another one.
# Other allowed values are "randi8_safe", "randdp" and "randdpvec"
#---------------------------------------------------------------------------
RAND   = randi8
# The following is highly reliable but may be slow:
# RAND   = randdp
```

:::info

In `config/make.def` we can set necessary flags for appropriate compilation, e.g. enabling OpenMP, optimisation flags, etc.

To enable instrumentation we added special wrapper `scorep` before actual compiler wrapper, e.g. `mpif77`. This will insert additional flags during compilation and add required libraries during linking phase.

:::

:::warning

The `scorep` instrumenter must be used with the link command to ensure that all required Score-P measurement libraries are linked with the executable. However, not all object files need to be instrumented, thereby avoiding measurements and data collection for routines and OpenMP constructs defined in those files. Instrumenting files defining OpenMP parallel regions is essential, as Score-P has to track the creation of new threads.

:::

Lets return to our root directory and clean-up:
```bash
$ cd $HOME/ihpcss25/NPB3.3-MZ-MPI/
$ make clean
```

Next, we build the instrumented version of BT-MZ:
```bash
$ make bt-mz CLASS=C NPROCS=8
   ===========================================
   =      NAS PARALLEL BENCHMARKS 3.3        =
   =      MPI+OpenMP Multi-Zone Versions     =
   =      F77                                =
   ===========================================

cd BT-MZ; make CLASS=C NPROCS=8 VERSION=
make[1]: Entering directory '/jet/home/zhukov/ihpcss25/NPB3.3-MZ-MPI/BT-MZ'
make[2]: Entering directory '/jet/home/zhukov/ihpcss25/NPB3.3-MZ-MPI/sys'
cc  -o setparams setparams.c -lm
make[2]: Leaving directory '/jet/home/zhukov/ihpcss25/NPB3.3-MZ-MPI/sys'
../sys/setparams bt-mz 8 C
make[2]: Entering directory '/jet/home/zhukov/ihpcss25/NPB3.3-MZ-MPI/BT-MZ'
scorep --user  mpif77 -c  -O3 -g -qopenmp	 bt.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 initialize.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 exact_solution.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 exact_rhs.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 set_constants.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 adi.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 rhs.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 zone_setup.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 x_solve.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 y_solve.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 exch_qbc.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 solve_subs.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 z_solve.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 add.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 error.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 verify.f
scorep --user  mpif77 -c  -O3 -g -qopenmp	 mpi_setup.f
cd ../common; scorep --user  mpif77 -c  -O3 -g -qopenmp	 print_results.f
cd ../common; scorep --user  mpif77 -c  -O3 -g -qopenmp	 timers.f
scorep --user  mpif77 -O3 -g -qopenmp	 -o ../bin.scorep/bt-mz_C.28 bt.o  initialize.o exact_solution.o exact_rhs.o set_constants.o adi.o  rhs.o zone_setup.o x_solve.o y_solve.o  exch_qbc.o solve_subs.o z_solve.o add.o error.o verify.o mpi_setup.o ../common/print_results.o ../common/timers.o 
make[2]: Leaving directory '/jet/home/zhukov/ihpcss25/NPB3.3-MZ-MPI/BT-MZ'
Built executable ../bin.scorep/bt-mz_C.8
make[1]: Leaving directory '/jet/home/zhukov/ihpcss25/NPB3.3-MZ-MPI/BT-MZ'
```
As you might noticed now `scorep` stands before each compilation and linking command. This time executable was created in `bin.scorep` directory that allow us not to mess up with our baseline experiments.

Let's go to the directory where our new executable lies and copy batch script
```bash
$ cd bin.scorep
$ cp ../jobscript/bridges2/scorep.sbatch.C.8 .
```

Let's examine what `scorep.sbatch.C.8` does by executing `nano scorep.sbatch.C.8`
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
# highlight-next-line
export SCOREP_EXPERIMENT_DIRECTORY=scorep_bt-mz_${CLASS}_${PROCS}x${OMP_NUM_THREADS}_sum
#export SCOREP_FILTERING_FILE=../config/scorep.filt

mpirun -n $SLURM_NTASKS $EXE
```
In highlighted line we set name of the directory where we store measurements. This is not required, but helps identifying the measurement later on.

:::info

Score-P measurements are configured via environment variables with the prefix `SCOREP_`. The full list of available variables and their description can be found by executing the following command `scorep-info config-vars --full`

:::

Now we are ready to submit our batch script:
```bash
sbatch scorep.sbatch.C.8
```

Once your job complete check what is new in the execution directory
```bash
$ ls -l
bt-mz_C.8
profile-C.8-<jobid>.err
profile-C.8-<jobid>.out
scorep_bt-mz_C_8x6_sum
scorep.sbatch.C.8
```

What we see new there? `profile-C.8-<jobid>.err` includes stderr output, `profile-C.8-<jobid>.out` includes stdout output, and `scorep_bt-mz_C_8x6_sum` includes the measurement results collected by our instrumented application.

Let's examine what is inside measurement directory:
```bash
$ ls -1 scorep_bt-mz_C_8x6_sum/
MANIFEST.md
profile.cubex
scorep.cfg
```
The directory contains three files. `MANIFEST.md` includes the description of metadata, `profile.cubex` is an analysis report that was collected during the measurement, and `scorep.cfg` is a record of measurement configuration.

:::tip[Question]

Open the stdout file and find the metric "Time in seconds". Compare it to our baseline measurement [here](./baseline.md). Has it increased or decreased? If so, by how much? What do you think was the reason for the change? 

:::
