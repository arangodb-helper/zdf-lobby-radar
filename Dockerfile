FROM arangodb
MAINTAINER Frank Celler <info@arangodb.com>

COPY dump /dump

CMD ["arangorestore"]
