INSERT INTO TASKS (text) VALUES ("Ton"), ("Livestream"), ("Kamera"), ("Licht"), ("Livestream Ton");

INSERT INTO AVAILABILITIES (text) VALUES ("Ja"), ("Eventuell"), ("Nein");

INSERT INTO EVENTS(date, description) VALUES ("2025-01-05T11:00", "Neuer Prädikant");

INSERT INTO USER_AVAILABILITIES (userName, eventID, availabilityID) VALUES ("admin", 1, 1);

INSERT INTO USER_ASSIGNMENTS (eventID, taskID, userName) VALUES (1, 1, "admin");