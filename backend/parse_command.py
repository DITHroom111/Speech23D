# Imports the Google Cloud client library
from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types

word_to_command = {'rotate': 'rotate', 'turn': 'rotate', 'spin': 'rotate', 'twist': 'rotate',
                   'color': 'colour', 'colour': 'colour', 'green': 'colour', 'red': 'colour',
                   'white': 'colour', 'yellow': 'colour', 'blue': 'colour', 'black': 'colour',
                   'brown': 'colour', 'pink': 'colour',
                   'on': 'create_and_teleportate', 'under': 'create_and_teleportate',
                   'teleportate': 'teleportate', 'put': 'teleportate',
                   'create': 'create', 'add': 'create', 'draw': 'create', 'print': 'create',
                   'move': 'move', 'fly': 'move', 'go': 'move', 'jump': 'move', 'change': 'move',
                   'remove': 'remove', 'delete': 'remove',
                   'bigger': 'make bigger', 'big': 'make bigger', 'larger': 'make bigger', 'large': 'make bigger',
                   'smaller': 'make smaller', 'small': 'make smaller', 'reduce': 'make smaller',
                   'clear': 'clear'}
objects_belonging = {'everything': 'every'}

correct_directions = ['left', 'right', 'up', 'down', 'back', 'top', 'front', 'forward', 'on', 'under']
directions_to_draw = {'left': 'left', 'right': 'right', 'up': 'up', 'on': 'up', 'down': 'down', 'under': 'down',
                      'back': 'back', 'backward': 'back', 'top': 'front', 'front': 'front', 'forward': 'front'}

correct_colours = ['green', 'red', 'white', 'yellow', 'blue', 'black', 'brown', 'pink']
colour_to_rgb = {'green': (0.0, 1.0, 0.0), 'red': (1.0, 0.0, 0.0), 'white': (1.0, 1.0, 1.0),
                 'yellow': (1.0, 1.0, 0.0), 'blue': (0.0, 0.0, 1.0), 'black': (0.0, 0.0, 0.0),
                 'brown': (0.4, 0.0, 0.0), 'pink': (1.0, 0.0, 1.0)}

memory_base = []


def text2int(textnum, numwords={}):
    if not numwords:
        units = [
            "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
            "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
            "sixteen", "seventeen", "eighteen", "nineteen",
        ]

        tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

        scales = ["hundred", "thousand", "million", "billion", "trillion"]

        numwords["and"] = (1, 0)
        for idx, word in enumerate(units):
            numwords[word] = (1, idx)
        for idx, word in enumerate(tens):
            numwords[word] = (1, idx * 10)
        for idx, word in enumerate(scales):
            numwords[word] = (10 ** (idx * 3 or 2), 0)

    current = result = 0
    for word in textnum.split():
        if word not in numwords:
            raise Exception("Illegal word: " + word)

        scale, increment = numwords[word]
        current = current * scale + increment
        if scale > 100:
            result += current
            current = 0

    return result + current


def create_result_json(text, commands):
    return {'rawText': text, 'commands': commands}


def get_entities(text, client):
    document = types.Document(content=text, type=enums.Document.Type.PLAIN_TEXT)

    # Detects entities in the text
    entities = client.analyze_entities(document=document)
    return [el.name for el in entities.entities]


def get_syntax(text, client):
    document = types.Document(content=text, type=enums.Document.Type.PLAIN_TEXT)
    syntax = client.analyze_syntax(document=document)
    return None


def if_direction_is_correct(direction):
    if direction in correct_directions:
        return True
    return False


def if_object_in_memory_base(object_name):
    if object_name in memory_base:
        return True
    return False


def add_object_to_memory_base(object_name):
    memory_base.append(object_name)


def remove_object_from_memory_base(object_name):
    memory_base.remove(object_name)


def print_memory_base():
    print('Base consist of ' + ', '.join(memory_base))


def get_memory_base():
    return memory_base.copy()


def clear_memory_base():
    memory_base.clear()


def get_default_command(command_type, object_name):
    command = {'commandName': command_type, 'objectName': object_name}
    return command


def get_command_for_create(object_name):
    command = get_default_command('create', object_name)
    return command


def get_command_for_rotate(object_name, angle):
    command = get_default_command('rotate', object_name)
    command['angle'] = angle
    return command


def get_command_for_move(object_name, direction):
    command_direction = directions_to_draw[direction]
    command = get_default_command('move', object_name)
    command['type'] = command_direction
    return command


def get_command_for_teleportate(object_name, direction, subject_name):
    command_direction = directions_to_draw[direction]
    command = get_default_command('teleportate', object_name)
    command['edge'] = command_direction
    command['subjectName'] = subject_name
    return command


def get_command_for_create_and_teleportate(object_name, direction, subject_name):
    command_direction = directions_to_draw[direction]
    command = get_default_command('createAndTeleportate', object_name)
    command['edge'] = command_direction
    command['subjectName'] = subject_name
    return command


def get_command_for_remove(object_name):
    command = get_default_command('remove', object_name)
    return command


def get_command_for_make_bigger(object_name):
    command = get_default_command('makeBigger', object_name)
    return command


def get_command_for_make_smaller(object_name):
    command = get_default_command('makeSmaller', object_name)
    return command


def get_command_for_clear():
    command = get_default_command('clear', '')
    return command


def get_command_for_colour(object_name, colour):
    command = get_default_command('colour', object_name)
    rgb_colour = colour_to_rgb[colour]
    command['r'] = rgb_colour[0]
    command['g'] = rgb_colour[1]
    command['b'] = rgb_colour[2]
    return command


def remove_directions_from_text(text, direction):
    new_text = text.split()
    new_text.remove(direction)
    return ' '.join(new_text)


def text_to_command(text, client):
    if text == '':
        commands = []
        return commands
    direction = define_directions(text)
    if direction:
        text = remove_directions_from_text(text, direction)
    command_type = define_command_type(text)
    object_belonging = define_command_belonging(text)
    entities = get_entities(text, client)
    commands = []

    if command_type == 'create':
        assert len(entities) > 0, 'There is no anything to create'
        for object_name in entities:
            object_in_memory_base = if_object_in_memory_base(object_name)
            if not object_in_memory_base:
                print(memory_base)
                add_object_to_memory_base(object_name)
                print(memory_base)
                current_command = get_command_for_create(object_name)
                commands.append(current_command)

    if command_type == 'rotate':
        objects_to_rotate = []
        if object_belonging == 'one':
            object_name = entities[0]
            objects_to_rotate.append(object_name)
        if object_belonging == 'every':
            objects_to_rotate = get_memory_base()
        for object_name in objects_to_rotate:
            object_in_memory_base = if_object_in_memory_base(object_name)
            if object_in_memory_base:
                if len(entities) > 1:
                    angle = float(text2int(entities[1])) * 3.14 / 180
                else:
                    angle = 3.14 / 2
                current_command = get_command_for_rotate(object_name, angle)
                commands.append(current_command)

    if command_type == 'move':
        objects_to_move = []
        if object_belonging == 'one':
            object_name = entities[0]
            objects_to_move.append(object_name)
        if object_belonging == 'every':
            objects_to_move = get_memory_base()
        direction_is_correct = if_direction_is_correct(direction)
        for object_name in objects_to_move:
            object_in_memory_base = if_object_in_memory_base(object_name)
            if object_in_memory_base:
                if direction_is_correct:
                    current_command = get_command_for_move(object_name, direction)
                    commands.append(current_command)
                else:
                    print('Repeat direction')

    if command_type == 'teleportate':
        object_name = entities[0]
        subject_name = entities[1]
        direction_is_correct = if_direction_is_correct(direction)
        object_in_memory_base = if_object_in_memory_base(object_name)
        subject_in_memory_base = if_object_in_memory_base(subject_name)
        if not object_in_memory_base:
            add_object_to_memory_base(object_name)
            current_command = get_command_for_create(object_name)
            commands.append(current_command)
        if not subject_in_memory_base:
            add_object_to_memory_base(subject_name)
            current_command = get_command_for_create(subject_name)
            commands.append(current_command)
        if direction_is_correct:
            current_command = get_command_for_teleportate(object_name, direction, subject_name)
            commands.append(current_command)
        else:
            print('Repeat direction')

    if command_type == 'remove':
        objects_to_delete = []
        if object_belonging == 'one':
            assert len(entities) > 0, 'There is no anything to remove'
            objects_to_delete = entities.copy()
        if object_belonging == 'every':
            objects_to_delete = get_memory_base()
        for object_name in objects_to_delete:
            object_in_memory_base = if_object_in_memory_base(object_name)
            if object_in_memory_base:
                remove_object_from_memory_base(object_name)
                current_command = get_command_for_remove(object_name)
                commands.append(current_command)

    if command_type == 'make bigger':
        objects_to_make_bigger = []
        if object_belonging == 'one':
            objects_to_make_bigger = entities.copy()
        if object_belonging == 'every':
            objects_to_make_bigger = get_memory_base()
        for object_name in objects_to_make_bigger:
            object_in_memory_base = if_object_in_memory_base(object_name)
            if object_in_memory_base:
                current_command = get_command_for_make_bigger(object_name)
                commands.append(current_command)

    if command_type == 'make smaller':
        objects_to_make_smaller = []
        if object_belonging == 'one':
            objects_to_make_smaller = entities.copy()
        if object_belonging == 'every':
            objects_to_make_smaller = get_memory_base()
        for object_name in objects_to_make_smaller:
            object_in_memory_base = if_object_in_memory_base(object_name)
            if object_in_memory_base:
                current_command = get_command_for_make_smaller(object_name)
                commands.append(current_command)

    if command_type == 'clear':
        clear_memory_base()
        current_command = get_command_for_clear()
        commands.append(current_command)

    if command_type == 'colour':
        print('we are in colour')
        print(entities)
        objects_to_colour = []
        if object_belonging == 'one':
            objects_to_colour = entities.copy()
        if object_belonging == 'every':
            objects_to_colour = get_memory_base()
        colour = find_colour_in_text(text)
        if colour:
            print(colour)
            for object_name in objects_to_colour:
                if len(object_name.split()) > 1:
                    object_name = object_name.split()[0]
                print('first', object_name)
                object_in_memory_base = if_object_in_memory_base(object_name)
                if object_in_memory_base:
                    print('second', object_name)
                    current_command = get_command_for_colour(object_name, colour)
                    print(current_command)
                    commands.append(current_command)

    if command_type == 'create_and_teleportate':
        object_name = entities[0]
        subject_name = entities[1]
        direction_is_correct = if_direction_is_correct(direction)
        subject_in_memory_base = if_object_in_memory_base(subject_name)
        if subject_in_memory_base:
            if direction_is_correct:
                current_command = get_command_for_create_and_teleportate(object_name, direction, subject_name)
                commands.append(current_command)
            else:
                print('Repeat direction')

    return commands


def define_command_type(text):
    default_command_type = 'create'
    for word in word_to_command.keys():
        if word in text.split():
            command_type = word_to_command[word]
            return command_type
    return default_command_type


def define_command_belonging(text):
    default_object_belonging = 'one'
    for word in objects_belonging.keys():
        if word in text.split():
            object_belonging = objects_belonging[word]
            return object_belonging
    return default_object_belonging


def define_directions(text):
    splitted_text = text.split()
    for direction in correct_directions:
        if direction in splitted_text:
            return direction
    return None


def find_colour_in_text(text):
    for correct_colour in correct_colours:
        if correct_colour in text.split():
            return correct_colour
    return None


def parse_command(text):
    client = language.LanguageServiceClient()
    text = text.lower()
    commands = text_to_command(text, client)
    result_json = create_result_json(text, commands)
    return result_json
