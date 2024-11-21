"""Push one or more folders to one or more robots."""
import subprocess
import multiprocessing
import json

global folders
# Opentrons folders that can be pushed to robot
folders = [
    "abr-testing",
    "hardware-testing",
    "abr-testing + hardware-testing",
    "other",
]


def push_subroutine(cmd: str) -> None:
    """Pushes specified folder to specified robot."""
    try:
        subprocess.run(cmd)
    except Exception:
        print("failed to push folder")
        raise


def main(folder_to_push: str, robot_to_push: str) -> int:
    """Main process!"""
    cmd = "make -C {folder} push-ot3 host={ip}"
    robot_ip_path = ""
    push_cmd = ""
    folder_int = int(folder_to_push)
    if folders[folder_int].lower() == "abr-testing + hardware-testing":
        if robot_to_push.lower() == "all":
            robot_ip_path = input("Path to robot ips: ")
            with open(robot_ip_path, "r") as ip_file:
                robot_json = json.load(ip_file)
                robot_ips_dict = robot_json.get("ip_address_list")
                robot_ips = list(robot_ips_dict.keys())
                ip_file.close()
        else:
            robot_ips = [robot_to_push]
        for folder_name in folders[:-2]:
            # Push abr-testing and hardware-testing folders to all robots
            for robot in robot_ips:
                print_proc = multiprocessing.Process(
                    target=print, args=(f"Pushing {folder_name} to {robot}!\n\n",)
                )
                print_proc.start()
                print_proc.join()
                push_cmd = cmd.format(folder=folder_name, ip=robot)
                process = multiprocessing.Process(
                    target=push_subroutine, args=(push_cmd,)
                )
                process.start()
                process.join()
                print_proc = multiprocessing.Process(target=print, args=("Done!\n\n",))
                print_proc.start()
                print_proc.join()
    else:

        if folder_int == (len(folders) - 1):
            folder_name = input("Which folder? ")
        else:
            folder_name = folders[folder_int]
        if robot_to_push.lower() == "all":
            robot_ip_path = input("Path to robot ips: ")
            with open(robot_ip_path, "r") as ip_file:
                robot_json = json.load(ip_file)
                robot_ips = robot_json.get("ip_address_list")
            ip_file.close()
        else:
            robot_ips = [robot_to_push]

        # Push folder to robots
        for robot in robot_ips:
            print_proc = multiprocessing.Process(
                target=print, args=(f"Pushing {folder_name} to {robot}!\n\n",)
            )
            print_proc.start()
            print_proc.join()
            push_cmd = cmd.format(folder=folder_name, ip=robot)
            process = multiprocessing.Process(target=push_subroutine, args=(push_cmd,))
            process.start()
            process.join()
            print_proc = multiprocessing.Process(target=print, args=("Done!\n\n",))
            print_proc.start()
            print_proc.join()
    return 0


if __name__ == "__main__":
    for i, folder in enumerate(folders):
        print(f"{i}) {folder}")
    folder_to_push = input("Please Select a Folder to Push: ")
    robot_to_push = input("Type in robots ip (type all for all): ")
    print(main(folder_to_push, robot_to_push))
