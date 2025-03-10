"""Serial Log Measure Time."""
import argparse


def main(file_path: str) -> None:
    # TODO: open serial.log file
    # TODO: convert file into more parsable format (maybe hardware has some tools)
    # TODO: isolate each movement, counting theoretical and actual duration for each
    return


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--absolute-path-to-file", type=str, required=True)
    args = parser.parse_args()
    main(args.absolute_path_to_file)
