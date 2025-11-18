# punchfast
Rewards platform for smaller businesses

How to run:

Build the Docker image:
docker build -t punchfast .

Run the container:
docker run -p 5000:5000 punchfast

Access the app at http://localhost:5000

To stop the container press Ctrl+C or run docker stop with the container ID

(
    how to nuke docker:
    docker system prune -a --volumes
)