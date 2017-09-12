import os
import shutil
import multiprocessing
import sys

import unittest
import nose

def remove_log(file_path):
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except:
            print "Failed to delete {0}".format(file_path)
            shutil.rmtree(file_path)

def execute_command(command, out_file):
    def fork_it():
        print "Executing " + command
        os.system(command + ' |& tee ' + out_file)

    t = multiprocessing.Process(target=fork_it)
    t.daemon = True
    t.start()
    t.join(30)
    if t.is_alive():
        t.join(30)
        t.terminate()



def is_containing(expected, log_file):
    print "Searching for " + expected + " in " + log_file
    log = open(log_file,'r')
    for line in log:
        if expected in line:
            print "Found"
            return True
    print "Not found"
    return False


class RunWorkers_Tests(unittest.TestCase):
    EXPECTED_MESSAGES = ["Inside JS worker...", "JS worker", "Inside TS worker...", "TS Worker"]

    @classmethod
    def setUpClass(cls, logfile=""):
        remove_log("log_android.txt")
        remove_log("log_ios.txt")
        remove_log("logcat.txt")
        remove_log("syslog.txt")
        remove_log("log.txt")
        execute_command("npm i", "log.txt")

    def test001_run_android(self):
        execute_command("npm run start-android-bundle -- --justlaunch", "log_android.txt")
        execute_command("adb logcat", "logcat.txt")
        assert is_containing("Successfully started on device", "log_android.txt"), "App not started on device"
        for i in self.EXPECTED_MESSAGES:
            assert is_containing(i, "logcat.txt"), i + " not found in logcat.txt"

    def test002_run_ios(self):
        execute_command("npm run start-ios-bundle -- --justlaunch", "log_ios.txt")
        execute_command("idevicesyslog", "syslog.txt")
        assert is_containing("Successfully started on device", "log_ios.txt"), "App not started on device"
    #     for i in EXPECTED_MESSAGES:
    #         assert is_containing(i, "syslog.txt"), i + " not found in logcat.txt"

if __name__ == '__main__':
    # Run Tests
    arguments = ['nosetests', '-v', '-s', '--nologcapture', '--with-doctest', '--with-xunit', 'func_tests.py']
    nose.run(argv=arguments)